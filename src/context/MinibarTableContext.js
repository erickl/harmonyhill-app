import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";
import * as inventoryService from "../services/inventoryService.js";
import * as minibarService from "../services/minibarService.js";
import * as userService from "../services/userService.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { XIcon, CheckCheck } from 'lucide-react';
import PlusButton from "../components/PlusButton.js";
import MinusButton from "../components/MinusButton.js";
import * as ActivityStatus from "../models/ActivityStatus.js";
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
    
    const [isChanged,        setIsChanged       ] = useState(false);
    const [state,            setState           ] = useState(initState);
    const [totalStock,       setTotalStock      ] = useState(null);
    const [reservedStock,    setReservedStock   ] = useState(null);
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();

    const onDisplayMinibarTable = async (title, activity, headers, items, onSubmit) => {
        const newCount = Object.values(items).reduce((map, item) => {
            map[item.name] = item.count;
            return map;
        }, {});

        const isManagerOrAdmin_ = await userService.isManagerOrAdmin();
        setIsManagerOrAdmin(isManagerOrAdmin_);

        // Remove table columns for staff members
        if(isManagerOrAdmin_ === false) {
            for(const header of ["provided", "total", "reserved"]) {
                const indexToRemove = headers.indexOf(header);
                headers.splice(indexToRemove, 1);
            }
        }

        setState({
            activity     : activity,
            title        : title,
            headers      : headers,
            items        : Object.values(items),
            updatedCount : newCount,              
            onSubmit     : onSubmit,
        });

        if(utils.exists(headers, "total")) {
            loadTotalStock(activity, items);    
        }
        if(utils.exists(headers, "reserved")) {    
            loadReservedStock(activity, items);    
        }    
    }

    // todo: is there a need to get reserved stock, if we are counting the end stock, to calculate a sale?
    const loadReservedStock = async(activity, items) => {
        let reservedStock = {};

        // If activity is ongoing, fetch new reserved stock count
        if(ActivityStatus.Completed.greaterThan(activity.status)) {
            // Since already provided stock counts is part of the calculation, at housekeeping refills, 
            // we only need to know the reserved stock in other houses than this one
            const filter = {exceptBookingId : activity.bookingId};
            reservedStock = await minibarService.getReservedStock(filter, onError);
            if(reservedStock === false) return false;
        // If activity completed, display the reserved count as it was when it was completed. Don't fetch it anew
        } else {
            for(const item of Object.values(items)) {
                reservedStock[item.name] = item.reserved;
            }
        }

        setReservedStock(reservedStock);
    }

    const loadTotalStock = async(activity, items) => {
        if(utils.isEmpty(items)) return;

        let newTotalStock = {};

        // If activity is ongoing, fetch new total stock count
        if(ActivityStatus.Completed.greaterThan(activity.status)) {
            for(const item of Object.values(items)) {
                const itemTotalStock = newTotalStock[item.name] = await inventoryService.getCurrentQuantity(item.name, onError);
                if(itemTotalStock === false) return false;
                newTotalStock[item.name] = itemTotalStock;
            }
        // If activity completed, display the total as it was when it was completed. Don't fetch it anew
        } else {
            for(const item of Object.values(items)) {
                newTotalStock[item.name] = item.total;
            }
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
        onConfirm("Submit the minibar count?", async() => {
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
        });
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

        // For start and refill count, the current count is about how much stock to ADD/REFILL.
        // And we can't add more than we have in storage
        if(state.activity.subCategory !== "checkout") {
            if(totalStock !== null && reservedStock !== null) {
                const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
                const available = item.total - item.reserved - provided;
                if(state.updatedCount[item.name] > available) {
                    cellStyle.backgroundColor = "red";
                }
            }
        }
        // For end count (checkout), the current count is about how many is LEFT.
        // And there can't be more in the fridge than have been provided during their stay
        // If the provided header is not present, the provided data won't be displayed and the red marking won't make sense
        else if(utils.exists(state.headers, "provided")) {
            const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
            if(state.updatedCount[item.name] > provided) {
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

        const canStillEdit = ActivityStatus.Started.equals(state.activity.status) && utils.isToday(state.activity.startingAt);

        const minusButton = () => { 
            // Don't let the user change the count if the task is already completed
            return canStillEdit ? (
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
            return canStillEdit ? (
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
