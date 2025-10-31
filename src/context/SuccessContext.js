import React, { createContext, useState, useContext } from "react";
import SuccessModal from "../components/SuccessModal.js";

const SuccessNotificationContext = createContext();

export function SuccessNotificationProvider({ children }) {
    const [message, setMessage] = useState(null);
    const [show,    setShow]    = useState(false);

    const onSuccess = (message = null) => {
        setMessage(message);
        setShow(true);
    } 
    
    const hidePopup = () => {
        setMessage(null);
        setShow(false)
    }

    return (
        <SuccessNotificationContext.Provider value={{ onSuccess }}>
            {children}
            {show && (
                <SuccessModal message={message} onClose={() => hidePopup()}/>
            )}
        </SuccessNotificationContext.Provider>
    );
}

export function useSuccessNotification() {
    return useContext(SuccessNotificationContext);
}
