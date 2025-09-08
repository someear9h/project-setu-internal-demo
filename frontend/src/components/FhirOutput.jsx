// src/components/FhirOutput.jsx
import React from 'react';
import { FaCopy, FaDownload, FaCheckCircle } from 'react-icons/fa';

function FhirOutput({ fhirRecord, onGenerate, isVisible }) {
  if (!isVisible) return null;

  const copyToClipboard = () => {
    if (fhirRecord) {
      navigator.clipboard.writeText(JSON.stringify(fhirRecord, null, 2));
    }
  };

  const downloadJson = () => {
    if (fhirRecord) {
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
    <div className="card fhir-card">
      <div className="fhir-header">
        <h2 className="section-title">FHIR R4 Standardized Output</h2>
        {fhirRecord && <span className="generated-badge"><FaCheckCircle /> Generated</span>}
      </div>
      <div className="fhir-actions">
        <button className="action-button" onClick={onGenerate}>
          <span role="img" aria-label="document">📄</span> Generate FHIR Record
        </button>
        <button className="action-button secondary" onClick={copyToClipboard} disabled={!fhirRecord}>
          <FaCopy /> Copy JSON
        </button>
        <button className="action-button secondary" onClick={downloadJson} disabled={!fhirRecord}>
          <FaDownload /> Download
        </button>
      </div>
      {fhirRecord && (
        <>
          <div className="compliance-section">
            <h4 className="compliance-title">Compliance Features:</h4>
            <ul className="compliance-list">
              <li>FHIR R4 Compliant Structure</li>
              <li>Dual Coding (NAMASTE + ICD-11)</li>
              <li>Patient Consent Tracking</li>
              <li>ABHA Integration Ready</li>
              <li>Audit Trail Metadata</li>
            </ul>
          </div>
          <pre className="json-viewer">
            <code>{JSON.stringify(fhirRecord, null, 2)}</code>
          </pre>
        </>
      )}
    </div>
  );
}

export default FhirOutput;