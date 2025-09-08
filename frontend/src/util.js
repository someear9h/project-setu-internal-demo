// src/util.js

// This logic dynamically sets the backend URL based on whether
// the app is running locally or deployed on Choreo.
export const BASE_URL = window.location.hostname === 'localhost'
  ? ''  // Uses the proxy in vite.config.js for local development
  : "/choreo-apis/project-setu-internal-dem/backend/v1"; // Your Choreo Invoke URL