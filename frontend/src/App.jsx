// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL } from './util.js';
import Login from './components/Login.jsx';
import SearchBar from './components/SearchBar.jsx';
import TranslationResults from './components/TranslationResults.jsx';
import FhirOutput from './components/FhirOutput.jsx';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // Main application state
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedNamaste, setSelectedNamaste] = useState(null);
  const [icdResults, setIcdResults] = useState(null);
  const [fhirRecord, setFhirRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- API Client ---
  const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // --- Handlers ---
  const handleLogin = (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    // Reset state on logout
    setSearchTerm('');
    setSuggestions([]);
    setSelectedNamaste(null);
    setIcdResults(null);
    setFhirRecord(null);
  };
  
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
        const response = await api.get(`/autocomplete-namaste?term=${term}`);
        setSuggestions(response.data.results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 300),
    [token]
  );

  useEffect(() => {
    if(token) fetchSuggestions(searchTerm);
  }, [searchTerm, fetchSuggestions, token]);


  const handleSelectSuggestion = async (suggestion) => {
    setSearchTerm(suggestion.Traditional_Term);
    setSelectedNamaste(suggestion);
    setSuggestions([]);
    setIsLoading(true);
    setIcdResults(null);
    setFhirRecord(null);

    try {
      const response = await api.post('/translate/namaste-to-icd', {
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
      const response = await api.post('/generate-fhir-condition', payload);
      const fhirResponse = response.data;
      // Add mock metadata for display
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

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="logo">Ayush FHIR Coder</h1>
        {token && <button onClick={handleLogout} className="logout-button">Logout</button>}
      </header>
      <main className="main-content">
        {!token ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <SearchBar 
              searchTerm={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
              suggestions={suggestions}
              onSuggestionSelect={handleSelectSuggestion}
            />
            <TranslationResults 
              namasteResult={selectedNamaste}
              icdResult={icdResults}
              isLoading={isLoading}
            />
            <FhirOutput 
              fhirRecord={fhirRecord}
              onGenerate={handleGenerateFhir}
              isVisible={icdResults && !isLoading}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;