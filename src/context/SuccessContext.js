import React, { createContext, useState, useContext } from "react";
import SuccessModal from "../components/SuccessModal.js";

const SuccessNotificationContext = createContext();

export function SuccessNotificationProvider({ children }) {
    const [message, setMessage] = useState(null);

    const onSuccess = (message) => {
        //setMessage(`${message}`);
        setMessage("placeholder");
    } 
    
    const hidePopup = () => {
        setMessage(null);
    }

    return (
        <SuccessNotificationContext.Provider value={{ onSuccess }}>
            {children}
            {message && (
                <SuccessModal onClose={() => hidePopup()}/>
            )}
        </SuccessNotificationContext.Provider>
    );
}

export function useSuccessNotification() {
    return useContext(SuccessNotificationContext);
}
