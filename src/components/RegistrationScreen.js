import React, { useState } from 'react';

import './RegistrationScreen.css';
import logo from '../assets/logowhitegreen.png';
import * as userService from "../services/userService.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';

function RegistrationScreen({ onClose }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState(null);
      
  const onError = (errorMessage) => {
      setErrorMessage(errorMessage);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await userService.signUp(username, email, "staff", password, onError);
    if (success) {
        onClose();
    }
  };

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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
        </div>
        <div>
          <label>Email:</label>
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
        <button type="submit">Register</button>
        <button type="Cancel" onClick={() => onClose() }>Cancel</button>
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

export default RegistrationScreen;
