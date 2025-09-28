import React from 'react';
import { FaMapMarkerAlt, FaGlobe, FaStethoscope } from 'react-icons/fa';

function TranslationResults({ namasteResult, icdResult, isLoading }) {
  if (!namasteResult && !isLoading) return null;

  return (
    <div className="results-container">
      <h2 className="section-title centered-title">Code Translation Results</h2>
      {isLoading ? (
        <p className="loading-text">Loading Translation...</p>
      ) : (
        <>
          {/* NAMASTE CARD */}
          <div className="card result-card">
            <div className="card-header">
              <FaMapMarkerAlt color="#4A90E2" />
              <h3 className="card-title">NAMASTE Code (India)</h3>
            </div>
            <div className="namaste-main">
              <p className="code-text">{namasteResult?.NAMASTE_Code}</p>
              <p className="term-text">{namasteResult?.Traditional_Term}</p>
              <p className="description-text">{namasteResult?.Biomedical_Term}</p>
            </div>
            <div className="divider"></div>
            <p className="sub-header-text">WHO Ayurveda Reference</p>
            <div className="reference-chip">
              <span>WAT-FV-001</span> Ayurvedic Fever Pattern
            </div>
          </div>

          {/* ICD-11 CARD */}
          <div className="card result-card">
            <div className="card-header">
              <FaGlobe color="#4A90E2" />
              {/* --- CHANGE 1: Updated the main card title --- */}
              <h3 className="card-title">ICD-11 and TM2 Codes (International)</h3>
            </div>

            {/* Traditional Medicine Section */}
            <div className="icd-section">
              <div className="icd-header">
                <FaStethoscope color="#50E3C2" />
                {/* --- CHANGE 2: Updated the section header --- */}
                <span className="sub-header-text">Traditional Medicine (TM2)</span>
              </div>
              <p className="code-text-small">{icdResult?.tm?.code || 'N/A'}</p>
              <p className="term-text-small">{icdResult?.tm?.display || 'N/A'}</p>
            </div>

            {/* Biomedical Equivalent Section */}
            <div className="icd-section">
              <div className="icd-header">
                <FaStethoscope color="#F5A623" />
                {/* --- CHANGE 3: Updated the section header --- */}
                <span className="sub-header-text">ICD-11 Biomedical Equivalent</span>
              </div>
              <p className="code-text-small">{icdResult?.biomed?.code || 'N/A'}</p>
              <p className="term-text-small">{icdResult?.biomed?.display || 'N/A'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TranslationResults;
