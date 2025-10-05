import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AppProviders } from './components/AppProviders.js';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AppProviders>  
    <App />
  </AppProviders>
);

