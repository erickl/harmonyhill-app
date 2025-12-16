import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";
import * as inventoryService from "../services/inventoryService.js";
import * as minibarService from "../services/minibarService.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { XIcon, CheckCheck } from 'lucide-react';
import PlusButton from "../components/PlusButton.js";
import MinusButton from "../components/MinusButton.js";
import Spinner from '../components/Spinner.js';

const MinibarTableContext = createContext();

export function MinibarTableProvider({ children }) {
    const initState = {
        activity     : null,
        title        : null,
        headers      : null,
        items        : null,
        updatedCount : null,
        onSubmit     : null,
    };
    
    const [isChanged,     setIsChanged    ] = useState(false);
    const [state,         setState        ] = useState(initState);
    const [totalStock,    setTotalStock   ] = useState(null);
    const [reservedStock, setReservedStock] = useState(null);
    const [onSubmit,      setOnSubmit     ] = useState(null);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();

    const onDisplayMinibarTable = (title, activity, headers, items, onSubmit) => {
        const newCount = Object.values(items).reduce((map, item) => {
            map[item.name] = item.count;
            return map;
        }, {});

        //const headers_ = ["" /* minusButton */, ...headers, "" /* plusButton */];

        setState({
            activity     : activity,
            title        : title,
            headers      : headers,
            items        : Object.values(items),
            updatedCount : newCount,
            onSubmit     : onSubmit,
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
        setIsChanged(false);
        setTotalStock(null);
        setReservedStock(null);
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

    const onHandleSubmit = async() => {
        const itemsCopy = utils.deepCopy(state.items);
        const finalCount = itemsCopy.reduce((map, item) => {
            map[item.name] = {
                count    : state.updatedCount[item.name], 
                reserved : item.reserved, 
                total    : item.total
            };
            return map;
        }, {});

        const result = await state.onSubmit(finalCount);
        if(result === false) return false;
        hidePopup();
        onSuccess();
    }

    const tableCell = (index, value, cellStyle) => {
        const isLink = utils.isLink(value);
        const cellStyle_ = utils.isEmpty(cellStyle) ? valueColumnStyle : {...valueColumnStyle, ...cellStyle};
        const displayedValue = isLink ? <a href={value} style={{textDecoration:"none"}}>🔗</a> : value;
        return (
            <td style={cellStyle_} key={`${index}-value`}>
                {displayedValue} 
            </td>
        );
    };

    const tableRow = (index, item) => {
        let values = [];
        const cellStyle = {};
        
        for(const header of state.headers) {
            let value = "";

            if(header === "total") {
                item[header] = value = totalStock && utils.exists(totalStock, item.name) ? totalStock[item.name] : 0; 
            } else if(header === "reserved") {
                item[header] = value = reservedStock && utils.exists(reservedStock, item.name) ? reservedStock[item.name] : 0; 
            } else if(header === "count") {
                value = state.updatedCount[item.name];
            } else if(!utils.isEmpty(header)) {
                value = utils.exists(item, header) ? item[header] : "";
            }
            
            values.push(value);
        }

        if(totalStock !== null && reservedStock !== null) {
            const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
            const available = item.total - item.reserved - provided;
            if(state.updatedCount[item.name] > available) {
                cellStyle.backgroundColor = "red";
            }
        }
        
        const onChangeCount = (count) => {      
            const newCount = state.updatedCount[item.name] + count;

            // Count can be negative for housekeeping, since we might want to correct a count or take something out
            if(newCount >= 0 || state.activity.subCategory === "housekeeping") {
                const newState = utils.deepCopy(state);
                newState.updatedCount[item.name] = newCount;
                setState(newState); 
                
                const isChangedUpdate = newCount !== state.items[index].count;
                setIsChanged(isChangedUpdate);
            }
        }

        const minusButton = () => { 
            // Don't let the user change the count if the task is already completed
            return state.activity.status !== "completed" ? (
                <td>
                    <div style={{
                            display: "flex", 
                            justifyContent: "space-between" 
                        }}>
                        <MinusButton onClick={() => onChangeCount(-1)} />
                    </div>
                </td>
            ) : (
                <td></td>
            );
        };

        const plusButton = () => { 
            // Don't let the user change the count if the task is already completed
            return state.activity.status !== "completed" ? (
                <td>
                    <div style={{
                            display: "flex", 
                            justifyContent: "space-between" 
                        }}>
                        <PlusButton onClick={() => onChangeCount(1)}/> 
                    </div>
                </td>
            ) : (
                <td></td>
            );
        };
        
        return (
            <tr key={`${index}-row`}>
                {minusButton()}
                {values.map((value, c) => {
                    return tableCell(c, value, cellStyle);
                })}
                {plusButton()}
            </tr>
        );
    }

    return (
        <MinibarTableContext.Provider value={{ onDisplayMinibarTable }}>
            {children}
            {state.title && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div style={{
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            width: "100%"
                        }}>
                            <XIcon 
                                size={30}
                                style={{ color:'#f44336'}}
                                onClick={hidePopup}
                            />
                            {isChanged && (<CheckCheck 
                                size={30}
                                style={{ color:'#119249ff'}}
                                onClick={onHandleSubmit}
                            />)}
                        </div>
                        <h2>{state.title}</h2>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    {/* Empty start td for the minus button, left of the table */}
                                    <td />
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
