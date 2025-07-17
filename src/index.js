import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { MenuProvider } from './context/MenuContext';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <MenuProvider>
    <App />
  </MenuProvider>

);

