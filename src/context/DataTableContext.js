import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";

const DataTableContext = createContext();

export function DataTableProvider({ children }) {
    const [header, setHeader] = useState(null);
    const [data, setData] = useState(null);

    const onDisplayDataTable = (header, data) => {
        setHeader(header);
        setData(data);
    }
    
    const hidePopup = () => {
        setHeader(null);
        setData(null);
    }

    const tableStyle = { 
        borderCollapse: 'collapse', 
        width: '100%',
        fontFamily: 'sans-serif' 
    };

    const keyColumnStyle = {
        border: '1px solid black',
        padding: '8px',
        textAlign: 'left',
        backgroundColor: '#f2f2f2'
    };

    const valueColumnStyle = { 
        border: '1px solid black',
        padding: '8px' 
    };

    return (
        <DataTableContext.Provider value={{ onDisplayDataTable }}>
            {children}
            {data && (
                <div className="modal-overlay" onClick={() => hidePopup()}>
                    <div className="modal-box">
                        <h2>{header}</h2>
                        <table style={tableStyle}>
                            <tbody>
                                {Object.entries(data).map(([key, value]) => (
                                    <tr key={`${key}-row`}>
                                        <td style={keyColumnStyle} key={`${key}-key`}>{key}</td>
                                        <td style={valueColumnStyle} key={`${key}-value`}>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </DataTableContext.Provider>
    );
}

export function useDataTableModal() {
    return useContext(DataTableContext);
}
