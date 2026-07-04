import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";
import TextInput from "../components/TextInput.js";
import InputModal from "../components/InputModal.js";
import ButtonsFooter from "../components/ButtonsFooter.js";

const InputContext = createContext();

export function InputProvider({ children }) {
    const [showPopup, setShowPopup] = useState(false);
    const [onSubmit, setOnSubmit] = useState(null);

    const onInput = (onSubmit) => {
        setShowPopup(true);
        setOnSubmit(() => onSubmit);
    } 
    
    const hidePopup = () => {
        setShowPopup(false);
    }

    return (
        <InputContext.Provider value={{ onInput }}>
            {children}
            {showPopup && (
                <InputModal 
                    onSubmit={onSubmit}
                    onClose={hidePopup}
                />
            )}
        </InputContext.Provider>
    );
}

export function useInput() {
    return useContext(InputContext);
}
