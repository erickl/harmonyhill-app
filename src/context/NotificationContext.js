import React, { createContext, useState, useContext } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [header, setHeader] = useState(null);
    const [message, setMessage] = useState(null);

    const onError = (message) => {
        setHeader("Something happened...");
        setMessage(`${message}`);
    } 

    const onWarning = (message) => {
        setHeader("Warning!");
        setMessage(`${message}`);
    }

    const onInfo = (header, message) => {
        setHeader(header);
        setMessage(`${message}`);
    }
    
    const hidePopup = () => {
        setHeader(null);
        setMessage(null);
    }

    return (
        <NotificationContext.Provider value={{ onError, onWarning, onInfo }}>
            {children}
            {message && (
                <div className="modal-overlay" onClick={() => hidePopup()}>
                    <div className="modal-box">
                        <h2>{header}</h2>
                        <p>{message}</p>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}
