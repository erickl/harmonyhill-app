import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";

const DataTableContext = createContext();

export function DataTableProvider({ children }) {
    const initState = {
        title   : null,
        headers : null,
        rows    : null,
    };
    
    const [data, setData] = useState(initState);

    const onDisplayDataTable = (title, headers, rows) => {
        setData({
            title   : title,
            headers : headers,
            rows    : rows,
        });
    }
    
    const hidePopup = () => {
        setData(initState);
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

    const tableCell = (index, value) => {
        const isLink = utils.isLink(value);
        const displayedValue = isLink ? <a href={value} style={{textDecoration:"none"}}>🔗</a> : value;
        return (
            <td style={valueColumnStyle} key={`${index}-value`}>
                {displayedValue} 
            </td>
        );
    };

    const tableRow = (index, values) => {
        return (
            <tr key={`${index}-row`}>
                {values.map((value, c) => {
                    return tableCell(c, value);
                })}
            </tr>
        );
    }

    return (
        <DataTableContext.Provider value={{ onDisplayDataTable }}>
            {children}
            {data.title && (
                <div className="modal-overlay" onClick={() => hidePopup()}>
                    <div className="modal-box">
                        <h2>{data.title}</h2>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    {data.headers.map((header) => (
                                        <td style={keyColumnStyle}>
                                            {header}
                                        </td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row, r) => tableRow(r, row))}
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
