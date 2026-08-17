import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";
import TextInput from "../components/TextInput.js";
import IssueModal from "../components/IssueModal.js";
import ButtonsFooter from "../components/ButtonsFooter.js";

const IssueContext = createContext();

export function IssueProvider({ children }) {
    const [showPopup, setShowPopup] = useState(false);
    const [onSubmit, setOnSubmit] = useState(null);
    const [record, setRecord] = useState(null);

    const onInput = (record, onSubmit) => {
        setShowPopup(true);
        setRecord(record);
        setOnSubmit(() => onSubmit);
    } 
    
    const hidePopup = () => {
        setShowPopup(false);
    }

    return (
        <IssueContext.Provider value={{ onInput }}>
            {children}
            {showPopup && (
                <IssueModal 
                    onSubmit={onSubmit}
                    record={record}
                    onClose={hidePopup}
                />
            )}
        </IssueContext.Provider>
    );
}

export function useIssues() {
    return useContext(IssueContext);
}
