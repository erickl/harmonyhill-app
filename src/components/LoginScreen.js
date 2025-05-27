import React, { useState } from 'react';

import './LoginScreen.css';
import logo from '../assets/logowhitegreen.png';

function LoginScreen({ onLogin, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onError = (error) => {
    alert(error);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(email, password, onError);
    if (success) {
      onLoginSuccess(true);
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
      </form>
    </div>
  );
}

export default LoginScreen;
