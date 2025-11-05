import React, { createContext, useState, useContext } from "react";
import "../components/ProgressComponent.css";

const ProgressContext = createContext();

export function ProgressProvider({ children }) {
    const [progress, setProgress] = useState(100);

    const onProgress = (progressUpdate) => {
        progressUpdate = progressUpdate < 1 ? progressUpdate * 100 : progressUpdate;
        setProgress(Math.round(progressUpdate));
    }
    
    const hidePopup = () => {
        setProgress(100);
    }

    return (
        <ProgressContext.Provider value={{ onProgress }}>
            {children}
            {progress < 100 && (
                <div className="progress-modal-box">
                    <h3>{`Processing... ${progress}%`}</h3>
                </div>
            )}
        </ProgressContext.Provider>
    );
}

export function useProgressCounter() {
    return useContext(ProgressContext);
}
