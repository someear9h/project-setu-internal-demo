// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from './util.js';
import AiAssistant from './components/AiAssistant.jsx';
import BundleUpload from "./components/BundleUpload.jsx";


// ------------------
// Small SVG icons (kept inline so this file is standalone)
// ------------------
const FaSearch = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>);
const FaExclamationCircle = (props) => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" {...props}><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm-16-56h32v-32h-32v32zm0-224h32v160h-32V176z"></path></svg>);
const FaCheckCircle = (props) => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" {...props}><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628 0z"></path></svg>);

// ------------------
// LOGIN Component
// ------------------
function Login({ onLogin, onSwitchToRegister, initialUsername = '', initialPassword = '' }) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUsername(initialUsername);
    setPassword(initialPassword);
  }, [initialUsername, initialPassword]);

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
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Clinician Login</h2>
      <p className="login-subtitle">Access the terminology service</p>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ABHA ID (e.g., ABHA 1234)"
          className="login-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="login-input"
        />
        <button type="submit" disabled={isLoading} className="login-button">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="error-message"><FaExclamationCircle style={{ marginRight: '8px' }} />{error}</p>}
      </form>
      <p className="switch-auth-text">
        Don't have an account? <span onClick={onSwitchToRegister} className="switch-auth-link">Register here</span>
      </p>
    </div>
  );
}

// ------------------
// REGISTER Component
// ------------------
function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password || !fullName) {
      setError('All fields are required.');
      return;
    }
    if (!username.toUpperCase().startsWith('ABHA ')) {
      setError('ID should be starting with ABHA.');
      return;
    }

    setIsLoading(true);
    const payload = { username, full_name: fullName, password };

    try {
      await axios.post(`${BASE_URL}/register`, payload);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => onRegisterSuccess(username, password), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. This ABHA ID may already be taken.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Create Account</h2>
      <p className="login-subtitle">Join the Ayush Terminology Service</p>
      <form onSubmit={handleSubmit} className="login-form">
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name (e.g., Dr. Sanjay Gupta)" className="login-input"/>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter ABHA ID (e.g., ABHA 1122)" className="login-input"/>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="login-input"/>
        <button type="submit" disabled={isLoading} className="login-button">{isLoading ? 'Registering...' : 'Register'}</button>
        {error && <p className="error-message"><FaExclamationCircle style={{ marginRight: '8px' }} />{error}</p>}
        {success && <p className="success-message"><FaCheckCircle style={{ marginRight: '8px' }} />{success}</p>}
      </form>
      <p className="switch-auth-text">
        Already have an account? <span onClick={onSwitchToLogin} className="switch-auth-link">Login here</span>
      </p>
    </div>
  );
}

// ------------------
// AUTH wrapper (switch between login/register)
// ------------------
function Auth({ onLogin }) {
  const [view, setView] = useState('register');
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleRegisterSuccess = (username, password) => {
    setCredentials({ username, password });
    setView('login');
  };

  if (view === 'register') {
    return <Register onSwitchToLogin={() => setView('login')} onRegisterSuccess={handleRegisterSuccess} />;
  }

  return <Login onLogin={onLogin} onSwitchToRegister={() => setView('register')} initialUsername={credentials.username} initialPassword={credentials.password} />;
}

// ------------------
// Small UI components used in the main app
// ------------------
function SearchBar({ searchTerm, onSearchChange, suggestions, onSuggestionSelect }) {
  return (
    <div className="card">
      <div className="search-input-container">
        <span className="search-icon"><FaSearch /></span>
        <input
          type="text"
          className="search-input"
          placeholder="Search for a NAMASTE traditional term (e.g., Jvara)..."
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} className="suggestion-item" onClick={() => onSuggestionSelect(s)}>
              <strong>{s.Traditional_Term}</strong> ({s.NAMASTE_Code}) - {s.Biomedical_Term}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TranslationResults({ namasteResult, icdResult, isLoading }) {
  return (
    <div className="card">
      <h3>Translation</h3>
      {isLoading && <p>Loading...</p>}
      {!isLoading && !icdResult && <p>No translation selected</p>}
      {!isLoading && icdResult && (
        <div>
          <p><strong>NAMASTE:</strong> {namasteResult?.Traditional_Term} ({namasteResult?.NAMASTE_Code})</p>
          <p><strong>ICD-11/TM2:</strong> {icdResult.tm.display} — {icdResult.tm.code}</p>
          <p><strong>Biomedical Terms:</strong> {icdResult.biomed.display} — {icdResult.biomed.code}</p>
        </div>
      )}
    </div>
  );
}

function FhirOutput({ fhirRecord, onGenerate, isVisible }) {
  return (
    <div className="card">
      <h3>FHIR Output</h3>
      {fhirRecord ? (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(fhirRecord, null, 2)}</pre>
      ) : (
        <p>No FHIR record generated yet.</p>
      )}
      <div style={{ marginTop: 12 }}>
        <button onClick={onGenerate} disabled={!isVisible} className="login-button">Generate FHIR Condition</button>
      </div>
    </div>
  );
}

// ------------------
// MAIN APP
// ------------------
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedNamaste, setSelectedNamaste] = useState(null);
  const [icdResults, setIcdResults] = useState(null);
  const [fhirRecord, setFhirRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const api = useMemo(() => axios.create({
    baseURL: BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }), [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setSearchTerm(''); setSuggestions([]); setSelectedNamaste(null); setIcdResults(null); setFhirRecord(null);
  };

  const timeoutRef = useRef(null);
  const fetchSuggestions = useCallback((term) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (!token || term.length < 2) { setSuggestions([]); return; }
      try {
        const response = await api.get('/autocomplete-namaste', { params: { term } });
        setSuggestions(response.data.results || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300);
  }, [api, token]);

  useEffect(() => {
    fetchSuggestions(searchTerm);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }
  }, [searchTerm, fetchSuggestions]);

  const handleSelectSuggestion = async (suggestion) => {
    setSearchTerm(suggestion.Traditional_Term);
    setSelectedNamaste(suggestion);
    setSuggestions([]);
    setIsLoading(true);
    setIcdResults(null);
    setFhirRecord(null);

    try {
      const translateResponse = await api.post('/translate/namaste-to-icd', {
        namaste_code: suggestion.NAMASTE_Code,
        namaste_display: suggestion.Traditional_Term,
      });
      const candidates = translateResponse.data.candidates;

      if (candidates && candidates.length > 0) {
        const bestMatch = candidates[0];
        const entityId = bestMatch.entity_id;
        if (entityId) {
          const entityResponse = await api.get(`/entity/${entityId}`);
          const entityData = entityResponse.data;
          const finalIcdResult = {
            code: entityData.code || 'N/A',
            display: bestMatch.display || entityData.display || 'N/A',
          };
          setIcdResults({ tm: finalIcdResult, biomed: finalIcdResult });
        } else {
          setIcdResults({ tm: { code: 'Error', display: 'Not Found' }, biomed: { code: 'Error', display: 'Not Found' } });
        }
      } else {
        setIcdResults({ tm: { code: 'N/A', display: 'No match found' }, biomed: { code: 'N/A', display: 'No match found' } });
      }
    } catch (error) {
      console.error('Error during the translation process:', error);
      setIcdResults({ tm: { code: 'Error', display: 'API call failed' }, biomed: { code: 'Error', display: 'API call failed' } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiDiagnosisSelect = (aiResult) => {
    const suggestion = {
      NAMASTE_Code: aiResult.NAMASTE_code,
      Traditional_Term: aiResult.diagnosis,
      English_Description: aiResult.reasoning || "Generated by AI Assistant"
    };
    handleSelectSuggestion(suggestion);
  };

  const handleGenerateFhir = async () => {
    if (!selectedNamaste || !icdResults || !icdResults.biomed?.code || icdResults.biomed.code === 'N/A') return;
    const payload = {
      patient_id: 'Patient/example-01',
      namaste_code: selectedNamaste.NAMASTE_Code,
      namaste_display: selectedNamaste.Traditional_Term,
      icd_code: icdResults.biomed.code,
      icd_display: icdResults.biomed.display,
    };

    try {
      const response = await api.post('/generate-fhir-condition', payload);
      const fhirResponse = response.data || {};
      fhirResponse.id = 'condition-1';
      fhirResponse.meta = {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        security: [ { system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST', display: 'Healthcare Test Data' } ]
      };
      setFhirRecord(fhirResponse);
    } catch (error) {
      console.error('Error generating FHIR record:', error);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { margin: 0; background-color: #F8F9FA; font-family: 'Inter', sans-serif; color: #333; }
        .app { display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .app-header { width: 100%; padding: 15px 50px; background-color: white; border-bottom: 1px solid #EAECEF; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; }
        .logo { font-size: 24px; font-weight: 600; }
        .logout-button { background: none; border: 1px solid #D1D5DB; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-weight: 500; }
        .main-content { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; width: 100%; max-width: 1000px; box-sizing: border-box; }
        .login-container { background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); width: 400px; text-align: center; }
        .login-title { margin: 0 0 10px 0; font-size: 28px; font-weight: 600; }
        .login-subtitle { margin: 0 0 30px 0; color: #6B7280; }
        .login-form { display: flex; flex-direction: column; gap: 15px; }
        .login-input { padding: 12px 15px; border-radius: 8px; border: 1px solid #D1D5DB; font-size: 16px; }
        .login-button { padding: 12px; border-radius: 8px; border: none; background-color: #4A90E2; color: white; font-size: 16px; font-weight: 600; cursor: pointer; }
        .login-button:disabled { background-color: #9CA3AF; }
        .error-message { color: #EF4444; margin-top: 15px; display: flex; align-items: center; justify-content: center; }
        .success-message { color: #10B981; margin-top: 15px; display: flex; align-items: center; justify-content: center; font-weight: 500; }
        .switch-auth-text { margin-top: 25px; color: #6B7280; font-size: 14px; }
        .switch-auth-link { color: #4A90E2; font-weight: 600; cursor: pointer; }
        .card { background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); width: 100%; max-width: 800px; box-sizing: border-box; margin: 0 auto 30px auto; }
        .search-input-container { position: relative; }
        .search-icon { position: absolute; top: 50%; left: 15px; transform: translateY(-50%); color: #9CA3AF; }
        .search-input { width: 100%; padding: 15px 15px 15px 45px; border-radius: 8px; border: 1px solid #D1D5DB; font-size: 16px; box-sizing: border-box; }
        .suggestions-list { list-style: none; padding: 10px 0; margin: 10px 0 0 0; border: 1px solid #EAECEF; border-radius: 8px; max-height: 200px; overflow-y: auto; }
        .suggestion-item { padding: 12px 20px; cursor: pointer; border-bottom: 1px solid #EAECEF; }
      `}</style>

      <div className="app">
        <header className="app-header">
          <h1 className="logo">Ayush FHIR Coder</h1>
          {token && <button onClick={handleLogout} className="logout-button">Logout</button>}
        </header>
        <main className="main-content">
          {!token ? (
            <Auth onLogin={handleLogin} />
          ) : (
            <>
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                suggestions={suggestions}
                onSuggestionSelect={handleSelectSuggestion}
              />

              <AiAssistant api={api} onDiagnosisSelect={handleAiDiagnosisSelect} />

              <TranslationResults namasteResult={selectedNamaste} icdResult={icdResults} isLoading={isLoading} />
              <FhirOutput fhirRecord={fhirRecord} onGenerate={handleGenerateFhir} isVisible={Boolean(icdResults && !isLoading)} />
              <BundleUpload token={token} fhirRecord={fhirRecord} />

            </>
          )}
        </main>
      </div>
    </>
  );
}
