import { useState, useEffect } from "react";
import * as utils from "../utils.js";
import * as inventoryService from "../services/inventoryService.js";
import * as minibarService from "../services/minibarService.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { XIcon, CheckCheck } from 'lucide-react';
import PlusButton from "../components/PlusButton.js";
import MinusButton from "../components/MinusButton.js";
import * as ActivityStatus from "../models/ActivityStatus.js";
import Spinner from '../components/Spinner.js';

export function MinibarTableModal({title, activity, headers, items, onSubmit, onHide}) {
    const itemCount = Object.values(items).length;
    const subCategory = activity.subCategory;

    const initState = {
        activity     : null,
        title        : null,
        headers      : null,
        items        : null,
        updatedCount : null,
        onSubmit     : null,
        onHide       : null,
    };
    
    const [enableSubmit,          setEnableSubmit          ] = useState(false);
    const [enableClose,           setEnableClose           ] = useState(true);
    const [state,                 setState                 ] = useState(initState);
    const [totalStock,            setTotalStock            ] = useState(null);
    const [reservedStock,         setReservedStock         ] = useState(null);
    const [editable,              setEditable              ] = useState(false);
    const [countIsValid,          setCountIsValid          ] = useState(Array(itemCount).fill(true));
    const [errorMessages,         setErrorMessages         ] = useState(Array(itemCount).fill(""));
    const [displayedErrorMessage, setDisplayedErrorMessage ] = useState("");
    
    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();
    const { permissions} = useUserPermissions();

    const selectDisplayedErrorMessage = () => {
        const displayedErrorMessage = errorMessages.find((errMsg) => !utils.isEmpty(errMsg));
        setDisplayedErrorMessage(displayedErrorMessage ? displayedErrorMessage : "");
    };

    useEffect(() => {
        const load = async () => {
            const newCount = Object.values(items).reduce((map, item) => {
                // For checkout, force users to set count for all items, even if they're 0
                map[item.name] = item.count;
                return map;
            }, {});
            
            // // Remove some table columns for staff members
            if(permissions.isManagerOrAdmin === false) {
                for(const header of ["total", "reserved"]) {
                    const indexToRemove = headers.indexOf(header);
                    if(indexToRemove !== -1) headers.splice(indexToRemove, 1);
                }
            }

            // 'available' is a calculation of total stock, minus stock already provided in other villas
            if(subCategory !== "checkout") {
                headers.push("available");
            }

            setState({
                activity     : activity,
                title        : title,
                headers      : headers,
                items        : Object.values(items),
                updatedCount : newCount,              
                onSubmit     : onSubmit,
                onHide       : onHide,
            });
           
            loadTotalStock(activity, items);    
            loadReservedStock(activity, items);       
        };

        load();
    }, []);

    useEffect(() => {
        if(reservedStock !== null && totalStock !== null) {
            // Set initial error messages array, once the reserved and total stock has been loaded
            const newErrorMessages = [];
            for(const item of state.items) {
                const errorMessage_ = isCountValid(item, state.updatedCount[item.name]);
                newErrorMessages.push(errorMessage_);
            }
            setErrorMessages(newErrorMessages);
            selectDisplayedErrorMessage();
        }
    }, [reservedStock, totalStock]);

    useEffect(() => {
        selectDisplayedErrorMessage();
    }, [errorMessages]);

    useEffect(() => {
        const isEditable_ = state.activity && ActivityStatus.Started.equals(state.activity.status) && utils.isToday(state.activity.startingAt);
        setEditable(isEditable_);
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

        const allCountsValid = !Object.values(state.updatedCount).includes(null);
        
        // For checkout, it's fine if all new counts are zero
        setEnableSubmit((hasCountUpdate || subCategory === "checkout") && allCountsValid);
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

    const isCountValid = (item, newCount) => {
        //If count input is null, count it as 0
        newCount = newCount === null ? 0 : newCount;

        let errorMessage_ = "";

        // For start and refill count, the current count is about how much stock to ADD/REFILL.
        // And we can't add more than we have in storage
        if(subCategory === "checkin-prep" || subCategory === "housekeeping") {
            if(totalStock !== null && reservedStock !== null) {
                const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
                const total = utils.exists(totalStock, item.name) ? totalStock[item.name] : 0;
                const reserved = utils.exists(reservedStock, item.name) ? reservedStock[item.name] : 0;
                const available = Math.max(0, total - reserved - provided);
                if(newCount > available) { 
                    errorMessage_ = `Error: ${newCount} ${item.name} not available`;
                }
            }

            // Put at least as many items as required by our minimum stock standards
            // Cannot compare against minStock in house keeping, because we don't know how many is left when refilling
            if(subCategory === "checkin-prep" && newCount < item.minStock) {
                errorMessage_ = `Error: Provide minimum ${item.minStock} ${item.name}`;
            }
        }
        // For end count (checkout), the current count is about how many is LEFT.
        // And there can't be more in the fridge than have been provided during their stay
        // If the provided header is not present, the provided data won't be displayed and the red marking won't make sense
        else if(subCategory === "checkout") {
            if(utils.exists(state.headers, "provided")) {
                const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
                if(newCount > provided) {
                    errorMessage_ = `Error: We only provided ${item.provided} ${item.name}`;
                }
            }
        }

        return errorMessage_;
    }

    const tableCell = (index, value, cellStyle, plusButton, minusButton) => {
        value = value === null ? "-" : value;
        const isLink = utils.isLink(value);
        const cellStyle_ = utils.isEmpty(cellStyle) ? valueColumnStyle : {...valueColumnStyle, ...cellStyle};
        const displayedValue = isLink ? <a href={value} style={{textDecoration:"none"}}>🔗</a> : value;
        return (
            <td style={cellStyle_} key={`${index}-value`}>
                <div style={{display:"flex", justifyContent:"space-evenly", alignItems:"center"}}>
                    {minusButton}
                    {displayedValue}  
                    {plusButton}
                </div>
            </td>
        );
    };

    const tableRow = (index, item) => {
        let values = [];
        const cellStyle = { };
        
        for(const header of state.headers) {
            let value = "";

            if(header === "total") {
                item[header] = value = totalStock && utils.exists(totalStock, item.name) ? totalStock[item.name] : 0; 
            } else if(header === "reserved") {
                item[header] = value = reservedStock && utils.exists(reservedStock, item.name) ? reservedStock[item.name] : 0; 
            } else if(header === "available") {
                const totalLoaded = totalStock && utils.exists(totalStock, item.name);
                const reserved = reservedStock && utils.exists(reservedStock, item.name) ? reservedStock[item.name] : 0;
                const provided = utils.isEmpty(item.provided) ? 0 : item.provided;
                item[header] = value = totalLoaded ? totalStock[item.name] - reserved - provided : "-";
            } else if(header === "count") {
                value = state.updatedCount[item.name];
            } else if(header === "minimum stock") {
                value = item["minStock"];    
            } else if(header === "provided") {
                value = item.provided;
                // For refills, turn 'provided' into 'provided so far', including current count 
                if(subCategory !== "checkout") {
                    value += state.updatedCount[item.name];
                }
            } else if(!utils.isEmpty(header)) {
                value = utils.exists(item, header) ? item[header] : "";
            }
            
            values.push(value);
        }

        const errorMessage_ = isCountValid(item, state.updatedCount[item.name]);

        if(!utils.isEmpty(errorMessage_)) {
            cellStyle.backgroundColor = "#f0745b";
        }
        
        const onChangeCount = (diff) => { 
            let newCount = 0;

            // If updated count is not set yet, first click sets it to 0
            if(state.updatedCount[item.name] === null) {
                newCount = 0;
            } else {
                newCount = state.updatedCount[item.name] + diff;
            }    
            
            const errorMessage_ = isCountValid(item, newCount);
            const thisCountIsValid = utils.isEmpty(errorMessage_);

            // Mark the state if the item count is invalid
            setCountIsValid(prev => prev.map((valid, i) => i === index ? thisCountIsValid : valid));
            setErrorMessages(prev => prev.map((msg, i) => i === index ? errorMessage_ : msg));
            
            // Count can be negative, if taking items which were earlier provided. 
            // ...except when counting at checkout!
            const provided = utils.exists(item, "provided") ? item.provided : 0;
            if((subCategory === "checkout" && newCount >= 0) || (subCategory !== "checkout" && provided + newCount >= 0)) {
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
                {values.map((value, c) => {
                    // c == 1 is the 'count' column
                    const plusButton_ = c == 1 ? plusButton() : null;
                    const minusButton_ = c == 1 ? minusButton() : null;
                    return tableCell(c, value, cellStyle, plusButton_, minusButton_);
                })}
            </tr>
        );
    };

    const getHeaderDisplayName = (header) => {
        let displayName = header;
        if(header === "count" && activity && subCategory === "housekeeping") {
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
                <h4 style={{color:"red"}}>{displayedErrorMessage || "\u00A0"}</h4>
                <table style={tableStyle}>
                    <thead>
                        <tr>
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
