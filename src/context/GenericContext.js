import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";

const GenericContext = createContext();

export function GenericProvider({ children }) {
    const [header, setHeader] = useState(null);
    const [data, setData] = useState(null);

    const onDisplayPopup = (header, data) => {
        setHeader(header);
        setData(data);
    }
    
    const hidePopup = () => {
        setHeader(null);
        setData(null);
    }

    return (
        <GenericContext.Provider value={{ onDisplayPopup }}>
            {children}
            {data && (
                <div className="modal-overlay" onClick={() => hidePopup()}>
                    <div className="modal-box">
                        <h2>{header}</h2>
                        <div style={{ textAlign: 'left' }}>
                            {data}
                        </div>
                    </div>
                </div>
            )}
        </GenericContext.Provider>
    );
}

export function useGenericModal() {
    return useContext(GenericContext);
}
