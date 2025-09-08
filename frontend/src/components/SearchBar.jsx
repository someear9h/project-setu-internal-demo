// src/components/SearchBar.jsx
import React from 'react';
import { FaSearch } from 'react-icons/fa';

function SearchBar({ searchTerm, onSearchChange, suggestions, onSuggestionSelect }) {
  return (
    <div className="card">
      <h2 className="section-title">Search Traditional Diagnosis</h2>
      <div className="search-input-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search for a term like Jvara, Madhumeha..."
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} className="suggestion-item" onClick={() => onSuggestionSelect(s)}>
              <strong>{s.Traditional_Term}</strong> ({s.System}) - <em>{s.Biomedical_Term}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;