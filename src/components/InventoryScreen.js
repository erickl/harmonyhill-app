import React, { useState, useEffect } from 'react';
import * as inventoryService from "../services/inventoryService.js";
import * as userService from "../services/userService.js";
import * as bookingService from "../services/bookingService.js";
import * as expenseService from "../services/expenseService.js";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import MetaInfo from './MetaInfo.js';
import { Receipt, ShoppingCart, PlusCircle, MinusCircle } from 'lucide-react';
import "./InventoryScreen.css";
import Spinner from "./Spinner.js";
import { useDataTableModal } from '../context/DataTableContext.js';

export default function InventoryScreen({onNavigate, onClose}) {
    const [inventory,        setInventory       ] = useState([]   );
    const [isLoading,        setIsLoading       ] = useState(true );
    const [expandedItems,    setExpandedItems   ] = useState({}   );
    const [loadingExpanded,  setLoadingExpanded ] = useState({}   );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [isAdmin,          setIsAdmin         ] = useState(false);

    const { onError } = useNotification();
    const { onDisplayDataTable } = useDataTableModal();

    const handleSetExpanded = async(item) => {
        setLoadingExpanded((prev) => ({...prev, [item.id]: true}));
        await fetchItemInfo(item);
        setLoadingExpanded((prev) => ({...prev, [item.id]: false}));
    }

    const onAddStock = async(item) => {
        const items = [item];
        onNavigate("addInventory", {items});
    }

    const onSubtractStock = async(item) => {
        onNavigate("subtractInventory", {item});
    }

    const onDisplaySalesData = async(item) => {    
        const headers = ["#", "Date", "Quantity", "Booking", "Villa", "Sale Created By"];  
        const enhancedSales = [];

        for(let i = 0; i < item.sales.length; i++) {
            const sale = item.sales[i];
            const booking = await bookingService.getOne(sale.bookingId);
            const bookingName = booking ? booking.name : "-";
            const bookingHouse = booking ? (booking.house.trim().toLowerCase() === "harmony hill" ? "HH" : "JN") : "-";
            
            const enhancedSale = [
                i+1,
                utils.to_ddMMM(sale.createdAt),
                sale.quantity,
                bookingName,
                bookingHouse,
                sale.createdBy,
            ];
            
            enhancedSales.push(enhancedSale);
        }
        onDisplayDataTable("Sales", headers, enhancedSales);
    }

    const onDisplayRefillsData = async(item) => {
        const headers = ["#", "date", "quantity", "expense", "Receipt", "Refill Created By" ];  
        const enhancedRefills = [];

        for(let i = 0; i < item.refills.length; i++) {
            const refill = item.refills[i];
            const expense = await expenseService.getOne(refill.expenseId);
            
            const enhancedRefill = [
                i+1,
                utils.to_ddMMM(refill.createdAt),
                refill.quantity,
                expense.description,
                expense.photoUrl,
                refill.createdBy,
            ];
            
            enhancedRefills.push(enhancedRefill);
        }
        onDisplayDataTable("Refills", headers, enhancedRefills);
    }

    const fetchItemInfo = async (item) => {
        let updatedExpandedList = { ...(expandedItems || {}) };
        
        const expand = utils.isEmpty(updatedExpandedList[item.id]);
        if(expand) {
            item.refills = await inventoryService.getRefills(item.name, {}, onError);
            item.sales = await inventoryService.getSales(item.name, {}, onError);
            item.quantity = await inventoryService.getCurrentQuantity(item.name, onError);
            updatedExpandedList[item.id] = item;
        } else {
            updatedExpandedList[item.id] = null;
        }

        setExpandedItems(updatedExpandedList);
    };

    const handleEditItem = async(item) => {

    }

    useEffect(() => {
        const getInventory = async () => {
            const inventory_ = await inventoryService.get({}, onError);
            setInventory(inventory_);
            setIsLoading(false);
        };

        const getUserPermissions = async() => {
            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);
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
                <div> 
                    <button className="add-button" onClick={() => onNavigate('addInventory', {inventory})}>
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
                                        <div>
                                            {""}
                                        </div>
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
                                    
                                        <div className="inv-item-body-footer">
                                            {utils.exists(item, "quantity") && item.quantity > 0 && (
                                                <div className="inv-item-body-footer-icon">
                                                    <MinusCircle   
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSubtractStock(item);
                                                        }}
                                                    />
                                                    <p>Subtract</p>
                                                </div>
                                            )}

                                            <div className="inv-item-body-footer-icon">
                                                <Receipt   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDisplaySalesData(item);
                                                    }}
                                                />
                                                <p>Sales</p>
                                            </div>

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
