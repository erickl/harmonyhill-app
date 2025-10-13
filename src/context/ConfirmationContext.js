import React, { createContext, useState, useContext } from "react";
import ConfirmModal from "../components/ConfirmModal.js";

const ConfirmationContext = createContext();

export function ConfirmationProvider({ children }) {
    const [message, setMessage] = useState(null);
    const [onConfirmChoice, setOnConfirmChoice] = useState(null);

    const onConfirm = (message, onConfirmChoice) => {
        setMessage(`${message}`);
        
        const confirmChoiceCallback = async () => {
            await onConfirmChoice();
            hidePopup();
        };
        setOnConfirmChoice(() => confirmChoiceCallback);
    } 
    
    const hidePopup = () => {
        setMessage(null);
    }

    return (
        <ConfirmationContext.Provider value={{ onConfirm }}>
            {children}
            {message && (
                <ConfirmModal message={message} onCancel={() => hidePopup()} onConfirm={() => onConfirmChoice()}/>
            )}
        </ConfirmationContext.Provider>
    );
}

export function useConfirmationModal() {
    return useContext(ConfirmationContext);
}
