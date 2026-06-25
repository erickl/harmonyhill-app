import React, { useState, useEffect } from 'react';
import * as inventoryService from "../services/inventoryService.js";
import * as userService from "../services/userService.js";
import * as bookingService from "../services/bookingService.js";
import * as expenseService from "../services/expenseService.js";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { useProgressCounter } from "../context/ProgressContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import MetaInfo from './MetaInfo.js';
import { Receipt, ShoppingCart, PlusCircle, MinusCircle } from 'lucide-react';
import "./InventoryScreen.css";
import Spinner from "./Spinner.js";
import { useDataTableModal } from '../context/DataTableContext.js';

export default function InventoryScreen({onNavigate, onClose}) {
    const [inventory,        setInventory       ] = useState([]   );
    const [isLoading,        setIsLoading       ] = useState(true );
    const [expandedItems,    setExpandedItems   ] = useState({}   );
    const [itemInfo,         setItemInfo        ] = useState({}   );
    const [loadingExpanded,  setLoadingExpanded ] = useState({}   );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [isAdmin,          setIsAdmin         ] = useState(false);

    const { onError } = useNotification();
    const { onProgress } = useProgressCounter();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
    const { onDisplayDataTable } = useDataTableModal();

    const handleSetExpanded = async(item) => {
        setLoadingExpanded((prev) => ({...prev, [item.id]: true}));
        let updatedExpandedList = { ...(expandedItems || {}) };
        const expand = utils.isEmpty(updatedExpandedList[item.id]);
        if(expand) {
            await fetchItemInfo(item);
            updatedExpandedList[item.id] = item;
        } else {
            updatedExpandedList[item.id] = null;
        }

        setExpandedItems(updatedExpandedList);

        setLoadingExpanded((prev) => ({...prev, [item.id]: false}));
    }

    const fetchItemInfo = async (item) => {  
        item.refills = await inventoryService.getRefills(item.name, {}, onError);
        item.removals = await inventoryService.getRemovals(item.name, {}, onError);
        const futureRemovals = item.removals.filter((item) => utils.isAfterToday(item.doneAt));
        const reservedCount = futureRemovals.reduce((count, removal) => removal.quantity + count, 0);
        item.quantity = await inventoryService.getCurrentQuantity(item.name, onError);
        item.reserved = reservedCount;   
    };

    const onAddStock = async(item) => {
        const inventory = [item];
        onNavigate("addInventory", {inventory: inventory});
    }

    const onRemoveStock = async(item) => {
        onNavigate("removeInventory", {item: item});
    }

    const onCloseMonth = async() => {
        onConfirm("Are you sure you want to close month on all inventory?", async() => {
            const result = await inventoryService.closeMonthAllItems(null, null, onProgress, onError);
            if(result !== false) {
                onSuccess();
            }
        });
    }

    const onDisplayRemovalsData = async(item) => {    
        const headers = ["#", "Reason", "Removed At", "Quantity", "Booking", "Villa", "Removed By", "Comments", "Created"];  
        const enhancedRemovals = [];

        for(let i = 0; i < item.removals.length; i++) {
            const removal = item.removals[i];
            const booking = await bookingService.getOne(removal.bookingId);
            const bookingName = booking ? booking.name : "-";
            const bookingHouse = booking ? (booking.house.trim().toLowerCase() === "harmony hill" ? "HH" : "JN") : "-";
            
            const enhancedRemoval = [
                i+1,
                removal.reason,
                utils.to_ddMMM(removal.doneAt),
                removal.quantity,
                //removal.quantityBefore,
                bookingName,
                bookingHouse,
                removal.createdBy,
                removal.comments,
                utils.to_ddMMM(removal.createdAt),
            ];
            
            enhancedRemovals.push(enhancedRemoval);
        }
        onDisplayDataTable("Removals", headers, enhancedRemovals);
    }

    const onDisplayRefillsData = async(item) => {
        const headers = ["#", "Refill At", "Quantity", "expense", "Receipt", "Refill By", "Created" ];  
        const enhancedRefills = [];

        for(let i = 0; i < item.refills.length; i++) {
            const refill = item.refills[i];
            const expense = await expenseService.getOne(refill.expenseId);
            
            const enhancedRefill = [
                i+1,
                utils.to_ddMMM(refill.doneAt),
                refill.quantity,
                //refill.quantityBefore,
                `${expense.index}. ${expense.description}`,
                expense.photoUrl,
                refill.createdBy,
                utils.to_ddMMM(refill.createdAt),
            ];
            
            enhancedRefills.push(enhancedRefill);
        }
        onDisplayDataTable("Refills", headers, enhancedRefills);
    }

    // todo
    const handleEditItem = async(item) => {

    }

    useEffect(() => {
        const getInventory = async () => {
            const inventory_ = await inventoryService.get({}, onError);
            setInventory(inventory_);
            setIsLoading(false);

            const newItemInfo = { ...(itemInfo || {}) };
            for(const item of inventory_) {
                const quantity = await inventoryService.getCurrentQuantity(item.name, onError);
                newItemInfo[item.id] = {quantity : quantity};
            }
            setItemInfo(newItemInfo);
        };

        const getUserPermissions = async() => {
            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);
            
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);
        } 

        getUserPermissions();
        getInventory();
    }, []);

    if(isLoading) {
        return <p>Loading...</p>;
    }
    
    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Inventory</h2>
                </div>
                <div className="card-header-right-top-row">
                    {isAdmin && (<>
                        <button onClick={onCloseMonth}>Close</button>
                    </>)}
                    <button className="add-button" onClick={() => onNavigate('addInventory', {inventory:inventory})}>
                        +
                    </button> 
                </div>
            </div>
            <div className="card-content">
                {inventory.map((item) => {
                    return (
                        <React.Fragment key={item.id}>
                            <div className="inv-item-box" onClick={()=> handleSetExpanded(item)}>
                                <div className="inv-item-header">
                                    <div className="inv-item-header-left">
                                        <div className="inv-item-title">
                                            {`${utils.capitalizeWords(item.name)}`}
                                        </div>
                                    </div>
                                    <div className="inv-item-header-right">
                                        {utils.exists(itemInfo, item.id) && utils.exists(itemInfo[item.id], "quantity") && (
                                            <div>
                                                {itemInfo[item.id].quantity}
                                            </div>
                                        )}
                                        <div className="expand-icon">
                                            {expandedItems[item.id] ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.capitalizeWords(item.type)} 
                                </div>

                                {loadingExpanded?.[item.id] === true ? (
                                    <Spinner />
                                ) : expandedItems?.[item.id] ? (
                                    <div className="inv-item-body">
                                        {utils.exists(item, "quantity") && (
                                            <div>
                                                Quantity: {item.quantity}
                                            </div>
                                        )}
                                        {utils.exists(item, "reserved") && item.reserved > 0 && (
                                            <div>
                                                Reserved: {item.reserved}
                                            </div>
                                        )}
                                    
                                        <div className="inv-item-body-footer">
                                            {utils.exists(item, "quantity") && item.quantity > 0 && (
                                                <div className="inv-item-body-footer-icon">
                                                    <MinusCircle   
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveStock(item);
                                                        }}
                                                    />
                                                    <p>Remove</p>
                                                </div>
                                            )}

                                            <div className="inv-item-body-footer-icon">
                                                <PlusCircle   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddStock(item);
                                                    }}
                                                />
                                                <p>Add</p>
                                            </div>

                                            <div className="inv-item-body-footer-icon">
                                                <Receipt   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDisplayRemovalsData(item);
                                                    }}
                                                />
                                                <p>Removals</p>
                                            </div>
                                      
                                            <div className="inv-item-body-footer-icon">
                                                <ShoppingCart   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDisplayRefillsData(item);
                                                    }}
                                                />
                                                <p>Refills</p>
                                            </div>
                                        </div>
                                        
                                        <MetaInfo document={item}/>
                                    </div>
                                ) : (<></>)}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
