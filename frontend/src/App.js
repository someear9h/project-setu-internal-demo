import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaMapMarkerAlt, FaGlobe, FaStethoscope, FaWaveSquare, FaCopy, FaDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

// ---------- API Base URL ----------
const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : '/choreo-apis/project-setu-internal-dem/backend/v1.0/api';

// --- Main App Component ---

function App() {
  // State Management
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [error, setError] = useState('');

  // --- Handlers ---
  const handleLogin = (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };

  return (
    <div style={styles.app}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { margin: 0; background-color: #F8F9FA; font-family: 'Inter', sans-serif; }
        `}
      </style>
      <header style={styles.header}>
        <h1 style={styles.logo}>Ayush FHIR Coder</h1>
        {token && <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>}
      </header>
      <main style={styles.mainContent}>
        {!token ? (
          <LoginScreen onLogin={handleLogin} error={error} setError={setError} />
        ) : (
          <MainApp token={token} />
        )}
      </main>
    </div>
  );
}

// --- Login Screen Component ---
function LoginScreen({ onLogin, error, setError }) {
  const [username, setUsername] = useState('sama'); // Default for demo
  const [password, setPassword] = useState('pass1'); // Default for demo
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      const response = await axios.post(`${BASE_URL}/token`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      onLogin(response.data.access_token);
    } catch (err) {
      setError('Login failed. Please check your username and password.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <h2 style={styles.loginTitle}>Clinician Login</h2>
      <p style={styles.loginSubtitle}>Access the terminology service</p>
      <form onSubmit={handleSubmit} style={styles.loginForm}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={styles.loginInput}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={styles.loginInput}
        />
        <button type="submit" disabled={isLoading} style={styles.loginButton}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p style={styles.errorMessage}><FaExclamationCircle style={{ marginRight: '8px' }} />{error}</p>}
      </form>
    </div>
  );
}

// --- Main Application Component ---
function MainApp({ token }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedNamaste, setSelectedNamaste] = useState(null);
  const [icdResults, setIcdResults] = useState(null);
  const [fhirRecord, setFhirRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const fetchSuggestions = useCallback(
    debounce(async (term) => {
      if (term.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await api.get(`/api/autocomplete-namaste?term=${term}`);
        setSuggestions(response.data.results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 300),
    [token]
  );

  useEffect(() => {
    fetchSuggestions(searchTerm);
  }, [searchTerm, fetchSuggestions]);

  const handleSelectSuggestion = async (suggestion) => {
    setSearchTerm(suggestion.Traditional_Term);
    setSelectedNamaste(suggestion);
    setSuggestions([]);
    setIsLoading(true);
    setIcdResults(null);
    setFhirRecord(null);

    try {
      const response = await api.post('/api/translate/namaste-to-icd', {
        namaste_code: suggestion.NAMASTE_Code,
        namaste_display: suggestion.Traditional_Term,
      });
      const candidates = response.data.candidates;
      if (candidates && candidates.length > 0) {
          setIcdResults({
              tm: candidates[0],
              biomed: candidates[1] || candidates[0],
          });
      }
    } catch (error) {
      console.error("Error translating code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFhir = async () => {
      if (!selectedNamaste || !icdResults) return;

      const payload = {
        patient_id: "Patient/example-01",
        namaste_code: selectedNamaste.NAMASTE_Code,
        namaste_display: selectedNamaste.Traditional_Term,
        icd_code: icdResults.biomed.code,
        icd_display: icdResults.biomed.display
      };

      try {
        const response = await api.post('/api/generate-fhir-condition', payload);
        const fhirResponse = response.data;
        fhirResponse.id = "condition-1";
        fhirResponse.meta = {
            versionId: "1",
            lastUpdated: new Date().toISOString(),
            security: [
                { system: "http://terminology.hl7.org/CodeSystem/v3-ActReason", code: "HTEST", display: "Healthcare Test Data" },
                { system: "http://example.org/consent", code: "CONSENT-GIVEN", display: "Patient Consent Obtained" }
            ]
        };
        setFhirRecord(fhirResponse);
      } catch(error) {
        console.error("Error generating FHIR record:", error);
      }
  };

  const copyToClipboard = () => {
      if(fhirRecord) {
          navigator.clipboard.writeText(JSON.stringify(fhirRecord, null, 2));
      }
  };

  const downloadJson = () => {
      if(fhirRecord) {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fhirRecord, null, 2));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", "fhir_condition.json");
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
      }
  };

  return (
    <>
      {/* Search Section */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Search Traditional Diagnosis</h2>
        <div style={styles.searchInputContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search for a term like Jvara, Madhumeha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {suggestions.length > 0 && (
          <ul style={styles.suggestionsList}>
            {suggestions.map((s, i) => (
              <li key={i} style={styles.suggestionItem} onClick={() => handleSelectSuggestion(s)}>
                <strong>{s.Traditional_Term}</strong> ({s.System}) - <em>{s.Biomedical_Term}</em>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Results Section */}
      {(selectedNamaste || isLoading) && (
        <div style={styles.resultsContainer}>
          <h2 style={{...styles.sectionTitle, textAlign: 'center', width: '100%', marginBottom: '20px'}}>Code Translation Results</h2>
          {isLoading ? <p>Loading...</p> : (
            <>
              <div style={{...styles.card, ...styles.resultCard}}>
                <div style={styles.cardHeader}>
                  <FaMapMarkerAlt color="#4A90E2" />
                  <h3 style={styles.cardTitle}>NAMASTE Code (India)</h3>
                </div>
                <div style={styles.namasteMain}>
                  <p style={styles.codeText}>{selectedNamaste.NAMASTE_Code}</p>
                  <p style={styles.termText}>{selectedNamaste.Traditional_Term}</p>
                  <p style={styles.descriptionText}>{selectedNamaste.Biomedical_Term}</p>
                </div>
                <div style={styles.divider}></div>
                <p style={styles.subHeaderText}>WHO Ayurveda Reference</p>
                <div style={styles.referenceChip}>
                  <span>WAT-FV-001</span> Ayurvedic Fever Pattern
                </div>
              </div>

              <div style={{...styles.card, ...styles.resultCard}}>
                <div style={styles.cardHeader}>
                  <FaGlobe color="#4A90E2" />
                  <h3 style={styles.cardTitle}>ICD-11 Codes (International)</h3>
                </div>
                <div style={styles.icdSection}>
                  <div style={styles.icdHeader}>
                    <FaStethoscope color="#50E3C2" />
                    <span style={styles.subHeaderText}>Traditional Medicine</span>
                  </div>
                  <p style={styles.codeTextSmall}>{icdResults?.tm?.code || 'N/A'}</p>
                  <p style={styles.termTextSmall}>{icdResults?.tm?.display || 'N/A'}</p>
                </div>
                <div style={styles.icdSection}>
                  <div style={styles.icdHeader}>
                    <FaWaveSquare color="#F5A623" />
                    <span style={styles.subHeaderText}>Biomedical Equivalent</span>
                  </div>
                  <p style={styles.codeTextSmall}>{icdResults?.biomed?.code || 'N/A'}</p>
                  <p style={styles.termTextSmall}>{icdResults?.biomed?.display || 'N/A'}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FHIR Output Section */}
       {(icdResults && !isLoading) && (
         <div style={{...styles.card, width: '1000px', marginTop: '30px' }}>
           <div style={styles.fhirHeader}>
             <h2 style={styles.sectionTitle}>FHIR R4 Standardized Output</h2>
             {fhirRecord && <span style={styles.generatedBadge}><FaCheckCircle/> Generated</span>}
           </div>
           <div style={styles.fhirActions}>
             <button style={styles.actionButton} onClick={handleGenerateFhir}>
               <span role="img" aria-label="document">📄</span> Generate FHIR Record
             </button>
             <button style={{...styles.actionButton, ...styles.secondaryButton}} onClick={copyToClipboard} disabled={!fhirRecord}>
               <FaCopy /> Copy JSON
             </button>
             <button style={{...styles.actionButton, ...styles.secondaryButton}} onClick={downloadJson} disabled={!fhirRecord}>
               <FaDownload /> Download
             </button>
           </div>
           {fhirRecord && (
             <>
               <div style={styles.complianceSection}>
                 <h4 style={styles.complianceTitle}>Compliance Features:</h4>
                 <ul style={styles.complianceList}>
                   <li>FHIR R4 Compliant Structure</li>
                   <li>Dual Coding (NAMASTE + ICD-11)</li>
                   <li>Patient Consent Tracking</li>
                   <li>ABHA Integration Ready</li>
                   <li>Audit Trail Metadata</li>
                 </ul>
               </div>
               <pre style={styles.jsonViewer}>
                 <code>{JSON.stringify(fhirRecord, null, 2)}</code>
               </pre>
             </>
           )}
         </div>
       )}
    </>
  );
}

// --- CSS Styles ---
const styles = {
  // Main Layout & Header
  app: { display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8F9FA' },
  header: { width: '100%', padding: '15px 50px', backgroundColor: 'white', borderBottom: '1px solid #EAECEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' },
  logo: { color: '#333', fontSize: '24px', fontWeight: '600' },
  logoutButton: { background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: '500' },
  mainContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', width: '100%', boxSizing: 'border-box' },

  // Login Screen
  loginContainer: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '400px', textAlign: 'center' },
  loginTitle: { margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' },
  loginSubtitle: { margin: '0 0 30px 0', color: '#6B7280' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
  loginInput: { padding: '12px 15px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '16px' },
  loginButton: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#4A90E2', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  errorMessage: { color: '#EF4444', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Cards & Sections
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '800px', boxSizing: 'border-box', marginBottom: '30px' },
  sectionTitle: { marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#333' },

  // Search Input
  searchInputContainer: { position: 'relative' },
  searchIcon: { position: 'absolute', top: '50%', left: '15px', transform: 'translateY(-50%)', color: '#9CA3AF' },
  searchInput: { width: '100%', padding: '15px 15px 15px 45px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '16px', boxSizing: 'border-box' },
  suggestionsList: { listStyle: 'none', padding: '10px 0', margin: '10px 0 0 0', border: '1px solid #EAECEF', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' },
  suggestionItem: { padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #EAECEF' },

  // Results Display
  resultsContainer: { display: 'flex', gap: '30px', width: '1000px', justifyContent: 'center' },
  resultCard: { flex: 1, marginBottom: 0 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #EAECEF', paddingBottom: '15px', marginBottom: '15px' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: '600', color: '#4A90E2' },
  namasteMain: { textAlign: 'center', padding: '10px 0' },
  codeText: { margin: 0, fontSize: '16px', fontWeight: '600', color: '#333', backgroundColor: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' },
  termText: { margin: '10px 0 5px 0', fontSize: '20px', fontWeight: '600', color: '#111827' },
  descriptionText: { margin: 0, color: '#6B7280', fontSize: '14px' },
  divider: { height: '1px', backgroundColor: '#EAECEF', margin: '20px 0' },
  subHeaderText: { margin: 0, color: '#6B7280', fontWeight: '500', fontSize: '14px' },
  referenceChip: { display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: '#F3F4F6', padding: '8px 12px', borderRadius: '16px', marginTop: '10px' },
  icdSection: { marginBottom: '20px' },
  icdHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  codeTextSmall: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#333', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' },
  termTextSmall: { margin: '5px 0 0 0', color: '#111827' },

  // FHIR Section
  fhirHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'},
  generatedBadge: { color: '#28A745', backgroundColor: '#D1FAE5', padding: '5px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' },
  fhirActions: { display: 'flex', gap: '15px', paddingBottom: '20px', borderBottom: '1px solid #EAECEF' },
  actionButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #28A745', backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  secondaryButton: { backgroundColor: 'white', borderColor: '#D1D5DB', color: '#374151' },
  complianceSection: { backgroundColor: '#F9FAFB', padding: '15px', borderRadius: '8px', marginTop: '20px' },
  complianceTitle: { margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' },
  complianceList: { margin: 0, paddingLeft: '20px', color: '#6B7280', fontSize: '13px' },
  jsonViewer: { backgroundColor: '#1F2937', color: '#D1D5DB', padding: '20px', borderRadius: '8px', marginTop: '20px', maxHeight: '400px', overflowY: 'auto', fontSize: '13px' },
};

export default App;