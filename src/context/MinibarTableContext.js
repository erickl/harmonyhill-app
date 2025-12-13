import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";
import * as inventoryService from "../services/inventoryService.js";
import * as minibarService from "../services/minibarService.js";
import { useNotification } from "../context/NotificationContext.js";
import { XIcon } from 'lucide-react';
import Spinner from '../components/Spinner.js';

const MinibarTableContext = createContext();

export function MinibarTableProvider({ children }) {
    const initState = {
        activity : null,
        title    : null,
        headers  : null,
        items    : null, //
    };
    
    const [state, setState] = useState(initState);
    const [totalStock, setTotalStock] = useState({});
    const [reservedStock, setReservedStock] = useState({});

    const { onError } = useNotification();

    const onDisplayMinibarTable = (title, activity, headers, items) => {
        setState({
            activity : activity,
            title    : title,
            headers  : headers,
            items    : Object.values(items),
        });

        loadTotalStock(items); 
        loadReservedStock(activity);
    }

    const loadReservedStock = async(activity) => {
        const filter = {exceptActivityId : activity.id};
        const reservedStock = await minibarService.getReservedStock(filter, onError);
        if(reservedStock === false) return false;
        setReservedStock(reservedStock);
    }

    const loadTotalStock = async(items) => {
        if(utils.isEmpty(items)) return;

        const newTotalStock = {};
        for(const item of Object.values(items)) {
            const itemTotalStock = newTotalStock[item.name] = await inventoryService.getCurrentQuantity(item.name, onError);
            if(itemTotalStock === false) return false;
            newTotalStock[item.name] = itemTotalStock;
        }
        setTotalStock(newTotalStock);
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

    const tableRow = (index, item) => {
        let values = [];
        const rowStyle = {};
        let total = null, reserved = null;

        for(const header of state.headers) {
            if(header === "total") {
                item[header] = total = utils.exists(totalStock, item.name) ? totalStock[item.name] : ""; 
            } else if(header === "reserved") {
                item[header] = reserved = utils.exists(reservedStock, item.name) ? reservedStock[item.name] : ""; 
            } 
            
            values.push(utils.exists(item, header) ? item[header] : "");
        }

        if(total && reserved && item.provided) {
            const available = item.total - item.reserved - item.provided;
            if(item.count > available) {
                rowStyle.backgroundColor = "red";
            }
        }

        const onChangeCount = (count) => {      
            const newCount = state.items[index].count + count;

            // Count can be negative for housekeeping, since we might want to correct a count or take something out
            if(newCount >= 0 || state.activity.subCategory === "housekeeping") {
                const newState = utils.deepCopy(state);
                newState.items[index].count = newCount;
                setState(newState);    
            }
        }

        const controlButtons = () => { 
            // Don't let the user change the count if the task is already completed
            return state.activity.status !== "completed" ? (
                <td>
                    <button onClick={() => onChangeCount(1)}>+</button>
                    <button onClick={() => onChangeCount(-1)}>-</button>
                </td>
            ) : (
                <td></td>
            );
        };
        
        return (
            <tr style={rowStyle} key={`${index}-row`}>
                {values.map((value, c) => {
                    return tableCell(c, value);
                })}
                {controlButtons()};
            </tr>
        );
    }

    return (
        <MinibarTableContext.Provider value={{ onDisplayMinibarTable }}>
            {children}
            {state.title && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div style={{ textAlign: "left"}}>
                            <XIcon 
                                size={30}
                                style={{ textAlign: "left", color:'#f44336'}}
                                onClick={hidePopup}
                            />
                            <h2>{state.title}</h2>
                        </div>
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
                                {state.items.map((item, r) => tableRow(r, item))}
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
