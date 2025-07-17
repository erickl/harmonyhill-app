import React, { useState, useEffect, use } from 'react';
import { useMenu } from '../context/MenuContext';
import * as userService from "../services/userService.js";
import ErrorNoticeModal from "./ErrorNoticeModal.js";

export default function SideMenu() {
  const { open, close } = useMenu();
  
  const [errorMessage, setErrorMessage] = useState(null);
  
  const onError = (errorMessage) => {
      setErrorMessage(errorMessage);
  } 

  const logout = async() => { 
    const success = await userService.logout();
    if(success) {
      close();
    } else {
      onError("Couldn't logout");
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: open ? 0 : '-500px',
        width: '250px',
        height: '100%',
        backgroundColor: '#333',
        color: 'white',
        transition: 'left 0.3s ease-in-out',
        zIndex: 999,
        padding: '1rem',
      }}
    >
      <button onClick={close} style={{ color: 'white', marginBottom: '1rem' }}>Close</button>
      <ul>
        <li><a href="/" style={{ color: 'white' }}>Home</a></li>
        <li><a onClick={() => logout()} style={{ color: 'white' }}>Logout</a></li>
      </ul>

      {errorMessage && (
          <ErrorNoticeModal 
              error={errorMessage}
              onClose={() => setErrorMessage(null) }
          />
      )}
    </div>
  );
}
