import React, { useState, useEffect } from 'react';
import { FaRobot, FaExclamationCircle } from 'react-icons/fa';
import { BASE_URL } from "../util.js";
import axios from "axios";

function AiAssistant() {
  const [symptoms, setSymptoms] = useState('');
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [aiResults, setAiResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      const shouldStop = await pollJobStatus(jobId);
      attempts++;
      if (shouldStop || attempts > 20) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  const cleanJsonString = (str) => {
    if (!str) return str;
    return str
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  };

  const pollJobStatus = async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/namaste-job/${id}`);
      const { status, prompt } = response.data;
      setJobStatus(status);

      if (status === 'completed') {
        if (prompt) {
          try {
            const clean = cleanJsonString(prompt);
            const parsedPrompt = JSON.parse(clean);
            const normalized = Array.isArray(parsedPrompt) ? parsedPrompt : [parsedPrompt];
            setAiResults(normalized);
          } catch (e) {
            console.warn("Prompt not JSON, showing raw:", prompt);
            setAiResults([{ diagnosis: prompt, reasoning: "Raw AI output" }]);
          }
        }
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Polling failed:', err);
      setError('Failed to get job status.');
      setIsLoading(false);
      setJobId(null);
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please enter clinical notes or symptoms.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAiResults([]);

    try {
      const response = await axios.post(
        `${BASE_URL}/create-namaste-job`,
        { symptoms },
        { headers: { "Content-Type": "application/json" } }
      );
      const { job_id, status } = response.data;
      setJobId(job_id);
      setJobStatus(status);
    } catch (err) {
      console.error(err);
      setError('Failed to start AI diagnosis job.');
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSymptoms('');
    setJobId(null);
    setJobStatus(null);
    setAiResults([]);
    setError('');
    setIsLoading(false);
  };

  return (
    <div className="card ai-assistant-card">
      <div className="card-header">
        <FaRobot color="#4A90E2" />
        <h3 className="card-title">AI Differential Diagnosis Assistant</h3>
      </div>

      {!jobId && (
        <form onSubmit={handleSubmit}>
          <p className="ai-description">Enter clinical notes or symptoms to get a list of potential NAMASTE diagnoses.</p>
          <textarea
            className="symptom-textarea"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., High fever that comes and goes, severe body ache, joint pain, and a complete loss of appetite."
          />
          <button type="submit" className="action-button" disabled={isLoading}>
            Suggest Diagnoses
          </button>
          {error && <p className="error-message"><FaExclamationCircle style={{ marginRight: '8px' }} />{error}</p>}
        </form>
      )}

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Analyzing symptoms with AI... This may take a moment.</p>
          <p className="loading-info">Job Status: {jobStatus || 'Initializing'}</p>
        </div>
      )}

      {!isLoading && aiResults.length > 0 && (
        <div className="ai-results-container">
          <h4 className="results-title">AI Suggestions</h4>
          {aiResults.map((result, index) => (
            <div key={index} className="ai-result-card">
              <p><strong style={{ fontWeight: "bold" }}>{result.diagnosis}</strong></p>
              <p><strong>Reasoning:</strong> {result.reasoning}</p>
            </div>
          ))}
          <button onClick={handleReset} className="action-button secondary reset-ai-btn">
            Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
}

export default AiAssistant;
