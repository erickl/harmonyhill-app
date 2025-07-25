import React, { useState } from 'react';

import "./RegistrationScreen";
import './LoginScreen.css';
import logo from '../assets/logowhitegreen.png';
import RegistrationScreen from './RegistrationScreen';
import ErrorNoticeModal from './ErrorNoticeModal.js';

function LoginScreen({ onLogin, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seeRegistrationForm, setSeeRegistrationForm] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);
        
  const onError = (errorMessage) => {
      setErrorMessage(errorMessage);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onLogin(email, password, onError);
    if (success === true) {
      onLoginSuccess(true);
    }
  };

  if(seeRegistrationForm) {
    return (
      <RegistrationScreen 
        onClose={() => setSeeRegistrationForm(false) }
      />
    )
  }

  return (
    <div className="login-container">
      <img
        src={logo}
        alt="Company Logo"
        className="logo"
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x50/cccccc/333333?text=Logo+Error'; }}
      />
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <br></br>
        <button type="submit">Login</button>
        <button 
          type="button" 
          onClick={() => {setSeeRegistrationForm(true)}}>Register
        </button>
      </form>

      {errorMessage && (
          <ErrorNoticeModal 
              error={errorMessage}
              onClose={() => setErrorMessage(null) }
          />
      )}
    </div>
  );
}

export default LoginScreen;
