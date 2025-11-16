import React, { useState, useEffect } from 'react';
import * as inventoryService from "../services/inventoryService.js";
import * as userService from "../services/userService.js";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import MetaInfo from './MetaInfo.js';
import { Receipt, ShoppingCart, Trash2, ImageDown } from 'lucide-react';
import "./InventoryScreen.css";
import Spinner from "./Spinner.js";
import { useDataTableModal } from '../context/DataTableContext.js';

export default function InventoryScreen({onNavigate, onClose}) {
    const [inventory,        setInventory       ] = useState([]   );
    const [refills,          setRefills         ] = useState([]   );
    const [sales,            setSales           ] = useState([]   );
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

    const fetchItemInfo = async (item) => {
        let updatedExpandedList = { ...(expandedItems || {}) };
        
        const expand = utils.isEmpty(updatedExpandedList[item.id]);
        if(expand) {
            const refills_ = await inventoryService.getRefills(item.name, {}, onError);
            setRefills(refills_);

            const sales_ = await inventoryService.getSales(item.name, {}, onError);
            setSales(sales_);

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
                                            {"right header placeholder"}
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
                                        <div>
                                            Placeholder 3
                                        </div>
                                    
                                        <div className="inv-item-body-footer">
                                            <div className="inv-item-body-footer-icon">
                                                <Receipt   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDisplayDataTable("Sales", sales);
                                                    }}
                                                />
                                                <p>Sales</p>
                                            </div>
                                      
                                            <div className="inv-item-body-footer-icon">
                                                <ShoppingCart   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDisplayDataTable("Refills", refills);
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
