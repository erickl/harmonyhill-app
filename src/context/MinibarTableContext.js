import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";

const MinibarTableContext = createContext();

export function MinibarTableProvider({ children }) {
    const initState = {
        title   : null,
        headers : null,
        data    : null,
    };
    
    const [state, setState] = useState(initState);

    const onDisplayMinibarTable = (title, headers, data) => {
        setState({
            title   : title,
            headers : headers,
            data    : Object.values(data),
        });
    }
    
    const hidePopup = () => {
        setState(initState);
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

    const tableRow = (index, obj) => {
        let values = [];
        for(const header of state.headers) {
            values.push(utils.exists(obj, header) ? obj[header] : "");
        }

        const rowStyle = {};

        const available = obj.total - obj.reserved;
        if(obj.count > available) {
            rowStyle.backgroundColor = "red";
        }
        
        return (
            <tr style={rowStyle} key={`${index}-row`}>
                {values.map((value, c) => {
                    return tableCell(c, value);
                })}
            </tr>
        );
    }

    return (
        <MinibarTableContext.Provider value={{ onDisplayMinibarTable }}>
            {children}
            {state.title && (
                <div className="modal-overlay" onClick={() => hidePopup()}>
                    <div className="modal-box">
                        <h2>{state.title}</h2>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    {state.headers.map((header) => (
                                        <td style={keyColumnStyle}>
                                            {utils.capitalizeWords(header)}
                                        </td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {state.data.map((obj, r) => tableRow(r, obj))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </MinibarTableContext.Provider>
    );
}

export function useMinibarTableModal() {
    return useContext(MinibarTableContext);
}
