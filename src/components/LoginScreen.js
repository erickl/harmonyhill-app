import React, { useState } from 'react';

function LoginScreen({ onLogin, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onError = (error) => {
    alert(error);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin( email, password, onError );
    if(success) {
        onLoginSuccess(true);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
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

      <button type="submit">Login</button>
    </form>
  );
}

export default LoginScreen;
