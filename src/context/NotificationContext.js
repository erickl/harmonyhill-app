import React, { createContext, useState, useContext } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [error, setError] = useState(null);

  const onError = (message) => setError(`Error: ${message}`);
  const onWarning = (message) => setError(`Warning: ${message}`);
  const hideError = () => setError(null);

  return (
    <NotificationContext.Provider value={{ onError, onWarning }}>
      {children}
      {error && (
        <div className="modal-overlay" onClick={() => hideError()}>
            <div className="modal-box">
                <h2>Something happened...</h2>
                <p>{error}</p>
            </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}