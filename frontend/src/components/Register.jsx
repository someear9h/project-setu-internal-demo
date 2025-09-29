import React, { useState } from 'react';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { BASE_URL } from '../util.js';

/**
 * Register component with ABHA ID validation and auto-login flow.
 * @param {object} props
 * @param {function} props.onSwitchToLogin - Function to switch the view to the login component.
 * @param {function} props.onRegisterSuccess - Callback function that passes the new credentials up to the parent component for the auto-login flow.
 */
function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [username, setUsername] = useState(''); // This field now represents the ABHA ID
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Validation Step ---
    if (!username || !password || !fullName) {
      setError('All fields are required.');
      return;
    }

    // New validation for ABHA ID prefix
    if (!username.toUpperCase().startsWith('ABHA ')) {
      setError('ID should be starting with ABHA.');
      return;
    }

    setIsLoading(true);

    const payload = { username, full_name: fullName, password };

    try {
      await axios.post(`${BASE_URL}/register`, payload);
      setSuccess('Registration successful! Redirecting to login...');

      // --- New Post-Registration Flow ---
      setTimeout(() => {
        onRegisterSuccess(username, password);
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. This ABHA ID may already be taken.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Create Account</h2>
      <p className="login-subtitle">Join the Ayush Terminology Service</p>

      {/* 🚀 Render Loading Note */}
      <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
        ⏳ Please wait while Render loads the app. <br />
        Once the server is ready, you can proceed to register.
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name (e.g., Dr. Sanjay Gupta)"
          className="login-input"
        />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter ABHA ID (e.g., ABHA 1122)"
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
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        {error && (
          <p className="error-message">
            <FaExclamationCircle style={{ marginRight: '8px' }} />
            {error}
          </p>
        )}
        {success && (
          <p className="success-message">
            <FaCheckCircle style={{ marginRight: '8px' }} />
            {success}
          </p>
        )}
      </form>

      <p className="switch-auth-text">
        Already have an account?{' '}
        <span onClick={onSwitchToLogin} className="switch-auth-link">
          Login here
        </span>
      </p>
    </div>
  );
}

export default Register;
