import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";

const DataTableContext = createContext();

export function DataTableProvider({ children }) {
    const [title, setTitle] = useState(null);
    const [headers, setHeaders] = useState(null);
    const [rows, setRows] = useState(null);

    const onDisplayDataTable = (title, headers, rows) => {
        setTitle(title);
        setHeaders(headers);
        setRows(rows);
    }
    
    const hidePopup = () => {
        setTitle(null);
        setHeaders(null);
        setRows(null);
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
            {title && (
                <div className="modal-overlay" onClick={() => hidePopup()}>
                    <div className="modal-box">
                        <h2>{title}</h2>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    {headers.map((header) => (
                                        <td style={keyColumnStyle}>
                                            {header}
                                        </td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, r) => (
                                    <tr key={`${r}-row`}>
                                        {row.map((value, c) => {
                                            const isLink = utils.isLink(value);
                                            return (
                                                <td style={valueColumnStyle} key={`${c}-value`}>
                                                    {isLink ? (
                                                        <a href={value} style={{textDecoration:"none"}}>🔗</a>
                                                    ) : (
                                                        value
                                                    )}
                                                   
                                                </td>
                                            );
                                        })}
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
