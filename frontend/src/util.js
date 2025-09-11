// src/util.js

// This logic dynamically sets the backend URL based on whether
// the app is running locally or deployed on Choreo.
export const BASE_URL = window.location.hostname === 'localhost'
  ? '/api'  // Uses the proxy in vite.config.js for local development
  : "https://project-setu-internal-demo.onrender.com/api";