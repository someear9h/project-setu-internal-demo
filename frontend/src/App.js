import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaMapMarkerAlt, FaGlobe, FaStethoscope, FaWaveSquare, FaCopy, FaDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

// ---------- API Base URL ----------
const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'            // Local FastAPI backend
  : '/choreo-apis/project-setu-internal-dem/backend/v1';  // Choreo endpoint

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
  const [username, setUsername] = useState('doctor_sanjay'); // Default for demo
  const [password, setPassword] = useState('supersecretpassword'); // Default for demo
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      const response = await axios.post(`${BASE_URL}/api/token`, params, {
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
    baseURL: BASE_URL,   // <- use dynamic base URL
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
      {/* ... rest of your UI code unchanged ... */}
    </>
  );
}

// --- CSS Styles ---
const styles = {
  app: { display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8F9FA' },
  header: { width: '100%', padding: '15px 50px', backgroundColor: 'white', borderBottom: '1px solid #EAECEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' },
  logo: { color: '#333', fontSize: '24px', fontWeight: '600' },
  logoutButton: { background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: '500' },
  mainContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', width: '100%', boxSizing: 'border-box' },
  loginContainer: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '400px', textAlign: 'center' },
  loginTitle: { margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' },
  loginSubtitle: { margin: '0 0 30px 0', color: '#6B7280' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
  loginInput: { padding: '12px 15px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '16px' },
  loginButton: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#4A90E2', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  errorMessage: { color: '#EF4444', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default App;
