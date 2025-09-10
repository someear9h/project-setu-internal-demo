// src/components/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { BASE_URL } from '../util.js';

function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !fullName) {
      setError('All fields are required.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      username,
      full_name: fullName,
      password,
    };

    try {
      await axios.post(`${BASE_URL}/register`, payload);
      setSuccess('Registration successful! Please log in.');
      setTimeout(() => {
        onSwitchToLogin(); // Switch to login view after a short delay
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Please try again.');
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
          placeholder="Username (e.g., doctor_sanjay)"
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
        {error && <p className="error-message"><FaExclamationCircle style={{ marginRight: '8px' }} />{error}</p>}
        {success && <p className="success-message"><FaCheckCircle style={{ marginRight: '8px' }} />{success}</p>}
      </form>
      <p className="switch-auth-text">
        Already have an account? <span onClick={onSwitchToLogin} className="switch-auth-link">Login here</span>
      </p>
    </div>
  );
}

export default Register;