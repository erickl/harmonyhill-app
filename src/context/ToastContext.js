import React, { createContext, useState, useContext } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [header, setHeader] = useState(null);
    const [message, setMessage] = useState(null);

    const onError = (message) => {
        setHeader("Something happened...");
        setMessage(`${message}`);
        return false;
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
        <ToastContext.Provider value={{ onError, onWarning, onInfo }}>
            {children}
            {message && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{header}</h2>
                        <p className="preserve-whitespaces">{message}</p>
                        <button onClick={() => hidePopup()}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
