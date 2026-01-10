import React, { createContext, useState, useEffect, useContext } from "react";
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
import { count } from "firebase/firestore";

export function MinibarTableModal({title, activity, headers, items, onSubmit, onHide}) {
    const itemCount = Object.values(items).length;

    const initState = {
        activity     : null,
        title        : null,
        headers      : null,
        items        : null,
        updatedCount : null,
        onSubmit     : null,
        onHide       : null,
    };
    
    const [enableSubmit,  setEnableSubmit ] = useState(false);
    const [enableClose,   setEnableClose  ] = useState(true);
    const [state,         setState        ] = useState(initState);
    const [totalStock,    setTotalStock   ] = useState(null);
    const [reservedStock, setReservedStock] = useState(null);
    const [editable,      setEditable     ] = useState(false);
    const [countIsValid,  setCountIsValid ] = useState(Array(itemCount).fill(true));
    
    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();

    useEffect(() => {
        const load = async () => {
            const newCount = Object.values(items).reduce((map, item) => {
                map[item.name] = item.count;
                return map;
            }, {});

            // const isManagerOrAdmin = await userService.isManagerOrAdmin();
            
            // // Remove some table columns for staff members
            // if(isManagerOrAdmin === false) {
            //     for(const header of ["provided", "total", "reserved"]) {
            //         const indexToRemove = headers.indexOf(header);
            //         headers.splice(indexToRemove, 1);
            //     }
            // }

            setState({
                activity     : activity,
                title        : title,
                headers      : headers,
                items        : Object.values(items),
                updatedCount : newCount,              
                onSubmit     : onSubmit,
                onHide       : onHide,
            });

            if(utils.exists(headers, "total")) {
                loadTotalStock(activity, items);    
            }
            if(utils.exists(headers, "reserved")) {    
                loadReservedStock(activity, items);    
            }
        };

        load();
    }, []);

    useEffect(() => {
        const isEditable_ = state.activity && ActivityStatus.Started.equals(state.activity.status) && utils.isToday(state.activity.startingAt);
        setEditable(isEditable_);

        // The minibar count always starts at 0. At checkout, possibly the guest took all items and the count
        // should stay 0, meaning there'll be no change in count. Thus enable submit button from the start
        if(isEditable_ && state.activity && state.activity.subCategory === "checkout") {
            setEnableSubmit(true);
        }
    }, [state.activity]);

    useEffect(() => {
        if(utils.isEmpty(state.updatedCount) || utils.isEmpty(countIsValid)) {
            return;
        }

        // If the count of any minibar item changed, make the submit button visible
        let hasCountUpdate = false;
        for(const [name, count] of Object.entries(state.updatedCount)) {
            const item = state.items.find((item) => name === item.name);
            if(item.count !== count) {
                hasCountUpdate = true;
                break;
            }
        }

        const allCountsValid = !countIsValid.includes(false);   

        setEnableSubmit(hasCountUpdate && allCountsValid);
    }, [countIsValid, state.updatedCount]);

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
            const editable_ = editable;
            try {
                setEditable(false);
                setEnableSubmit(false);
                setEnableClose(false);

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
                if(result === false) {
                    setEditable(editable_);
                    setEnableClose(true);
                    onHide();
                    return false;
                }
                
                onSuccess();
            } catch(e) {
                onError(`Unexpected error when submitting minibar count: ${e.message}`);
            } finally {
                setEditable(editable_);
                setEnableClose(true);
                onHide();
            }
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

        let thisCountIsValid = true;

        // For start and refill count, the current count is about how much stock to ADD/REFILL.
        // And we can't add more than we have in storage
        if(state.activity.subCategory !== "checkout") {
            if(totalStock !== null && reservedStock !== null) {
                const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
                const available = item.total - item.reserved - provided;
                if(state.updatedCount[item.name] > available) { 
                    thisCountIsValid = false;
                }
            }
        }
        // For end count (checkout), the current count is about how many is LEFT.
        // And there can't be more in the fridge than have been provided during their stay
        // If the provided header is not present, the provided data won't be displayed and the red marking won't make sense
        else if(utils.exists(state.headers, "provided")) {
            const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
            if(state.updatedCount[item.name] > provided) {
                thisCountIsValid = false;
            }
        }

        if(!thisCountIsValid) {
            cellStyle.backgroundColor = "red";
        }

        // Mark the state if the item count is invalid
        if(thisCountIsValid !== countIsValid[index]) {
            const nextCountIsValid = [...countIsValid];
            nextCountIsValid[index] = thisCountIsValid;  
            setCountIsValid(nextCountIsValid);
        }
        
        const onChangeCount = (diff) => {      
            const newCount = state.updatedCount[item.name] + diff;

            // Count can be negative for housekeeping, since we might want to correct a count or take something out
            if(newCount >= 0 || state.activity.subCategory === "housekeeping") {
                const newState = utils.deepCopy(state);
                newState.updatedCount[item.name] = newCount;
                setState(newState); 
            }
        }

        const minusButton = () => { 
            // Don't let the user change the count if the task is already completed
            return editable ? (
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
            return editable ? (
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
    };

    const getHeaderDisplayName = (header) => {
        let displayName = header;
        if(header === "count" && activity && activity.subCategory === "housekeeping") {
            displayName = "refill";
        }

        return utils.capitalizeWords(displayName);
    }

    return (  
        <div className="modal-overlay">
            <div className="modal-box">
                <div style={{
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    width: "100%"
                }}>
                    {enableClose && (<XIcon 
                        size={30}
                        style={{ color:'#f44336'}}
                        onClick={onHide}
                    />)}
                    {enableSubmit && (<CheckCheck 
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
                            {state.headers?.map((header) => (
                                <td style={keyColumnStyle}>
                                    {getHeaderDisplayName(header)}
                                </td>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {state.items?.map((item, r) => tableRow(r, item))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
