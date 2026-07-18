import React, { useState, useEffect, useContext } from 'react';
import * as inventoryService from "../services/inventoryService.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as bookingService from "../services/bookingService.js";
import * as expenseService from "../services/expenseService.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useNotification } from "../context/NotificationContext.js";
import { useDataTableModal } from "../context/DataTableContext.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import { PlusCircle, MinusCircle, CheckCircle, ShoppingCart, Receipt} from 'lucide-react';
import MetaInfo from "./MetaInfo.js";
import Spinner from './Spinner.js';
import * as utils from "../utils.js";
import "./InventoryComponent.css";

export default function InventoryComponent({context, item}) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(null);
    const [reserved, setReserved] = useState(null);
    const [removals, setRemovals] = useState(null);
    const [refills, setRefills] = useState(null);

    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
    const { onDisplayDataTable } = useDataTableModal();
    const { permissions } = useUserPermissions();

    const onDisplayRemovalsData = async(item) => {    
        const headers = ["#", "Reason", "Removed At", "Quantity", "Booking", "Villa", "Removed By", "Comments", "Created"];  
    
        if(!removals) return;

        const enhancedRemovals = await Promise.all(
            removals.map(async (removal, i) => {
                const booking = await bookingService.getOne(removal.bookingId);
                const bookingName = booking ? booking.name : "-";
                const bookingHouse = booking ? (booking.house.trim().toLowerCase() === "harmony hill" ? "HH" : "JN") : "-";
            
                const enchancedRemoval = [
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
                return enchancedRemoval;
            })
        );

        onDisplayDataTable("Removals", headers, enhancedRemovals);
    }

    const onDisplayRefillsData = async(item) => {
        const headers = ["#", "Refill At", "Quantity", "expense", "Receipt", "Refill By", "Created" ];
        
        if(!refills) return;
        
        const enhancedRefills = await Promise.all(
            refills.map(async (refill, i) => {
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

                return enhancedRefill;
            })  
        );

        onDisplayDataTable("Refills", headers, enhancedRefills);
    }

    const onAddStock = async(item) => {
        const inventory = [item];
        context.onNavigate("addInventory", {inventory: inventory});
    }

    const onRemoveStock = async(item) => {
        context.onNavigate("removeInventory", {item: item});
    }

    // todo
    const handleEditItem = async(item) => {

    }

    const handleSetExpanded = async(item) => {
        if(!expanded) {
            setLoading(prev => !prev);
            await fetchItemInfo(item); 
            setLoading(prev => !prev);
        } 
        setExpanded(prev => !prev);
    }

    const fetchItemInfo = async (item) => { 
        const getRefills = async() => {
            const refills_ = await inventoryService.getRefills(item.name, {}, onError);
            setRefills(refills_);
        }

        const getRemovals = async() => {
            const removals_ = await inventoryService.getRemovals(item.name, {}, onError);
            setRemovals(removals_);
        }
     
        if(!refills) getRefills();
        if(!removals) getRemovals();
    };

    useEffect(() => {
        if(removals) {
            const futureRemovals = removals.filter((item) => utils.isAfterToday(item.doneAt));
            const reservedCount = futureRemovals.reduce((count, removal) => removal.quantity + count, 0);
            setReserved(reservedCount);
        }
    }, [removals]);

    const onCloseItemInventory = async(item) => {
        onConfirm(`Close count for ${item.name}?`, async () => {
            const result = await inventoryService.closeItemCount(item.name, null, onError);
            if(result !== false) {
                onSuccess(`Closed ${item.name}`);
            }
        })
    }

    useEffect(() => {
        const load = async () => {
            const quantity_ = await inventoryService.getCurrentQuantity(item.name, onError);
            setQuantity(quantity_);
        }

        load();  
    })

    return (
        <div className="inv-item-box" onClick={()=> handleSetExpanded(item)}>
            <div className="inv-item-header">
                <div className="inv-item-header-left">
                    <div className="inv-item-title">
                        {`${utils.capitalizeWords(item.name)}`}
                    </div>
                </div>
                <div className="inv-item-header-right">
                    {quantity && (
                        <div>
                            {quantity}
                        </div>
                    )}
                    <div className="expand-icon">
                        {expanded ? '▼' : '▶'}
                    </div>
                </div>
            </div>  
            
            <div>
                {utils.capitalizeWords(item.type)} 
            </div>

            {loading ? (
                <Spinner />
            ) : expanded ? (
                <div className="inv-item-body">

                    {quantity !== null && (
                        <div>
                            Quantity: {quantity}
                        </div>
                    )}

                    {reserved !== null && (
                        <div>
                            Reserved: {reserved}
                        </div>
                    )}
                
                    <div className="inv-item-body-footer">
                        {permissions.canEditInventory && (<>
                            {quantity !== null && quantity > 0 && (
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
                        </>)}

                        {!utils.isEmpty(removals) && (
                            <div className="inv-item-body-footer-icon">
                                <Receipt   
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDisplayRemovalsData(item);
                                    }}
                                />
                                <p>Removals</p>
                            </div>
                        )}
                    
                        {!utils.isEmpty(refills) && (
                            <div className="inv-item-body-footer-icon">
                                <ShoppingCart   
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDisplayRefillsData(item);
                                    }}
                                />
                                <p>Refills</p>
                            </div>
                        )}

                        {permissions.isAdmin && (
                            <div className="inv-item-body-footer-icon">
                                <CheckCircle   
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCloseItemInventory(item);
                                    }}
                                />
                                <p>Lock</p>
                            </div>
                        )}
                    </div>
                    
                    <MetaInfo document={item}/>
                </div>
            ) : (<></>)}
        </div>
    );
}