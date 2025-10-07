import React, { createContext, useState, useContext } from "react";
import ReactMarkdown from "react-markdown";
import * as utils from "../utils.js";

const MarkDownContext = createContext();

export function MarkDownProvider({ children }) {
    const [header, setHeader] = useState(null);
    const [data, setData] = useState(null);

    const onDisplay = (header, object) => {
        setHeader(header);

        let markDown = `\`\`\``;

        if(object) {
            for(const key of Object.keys(object)) {
                let value = object[key];
                if(utils.isDate(value)) {
                    value = utils.toDateTime(value);
                }
                markDown += `${key}: ${value}\n\n`;
            }
        } else {
            markDown = "Document missing";
        }

        markDown += `\`\`\``;

        setData(markDown);
    }
    
    const hidePopup = () => {
        setHeader(null);
        setData(null);
    }

    return (
        <MarkDownContext.Provider value={{ onDisplay }}>
            {children}
            {data && (
                <div className="modal-overlay" onClick={() => hidePopup()}>
                    <div className="modal-box">
                        <h2>{header}</h2>
                        <div style={{ textAlign: 'left' }}>
                            <ReactMarkdown>{data}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </MarkDownContext.Provider>
    );
}

export function useMarkDownModal() {
    return useContext(MarkDownContext);
}
