import React, { useState, useEffect } from 'react';
import * as inventoryService from "../services/inventoryService.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { useProgressCounter } from "../context/ProgressContext.js";
import "./InventoryScreen.css";
import InventoryComponent from './InventoryComponent.js';

export default function InventoryScreen({context}) {
    const [inventory,        setInventory       ] = useState([]   );
    const [isLoading,        setIsLoading       ] = useState(true );
    const [itemInfo,         setItemInfo        ] = useState({}   );
    const [loadingExpanded,  setLoadingExpanded ] = useState({}   );

    const { onError } = useNotification();
    const { onProgress } = useProgressCounter();
    const { permissions } = useUserPermissions();

    useEffect(() => {
        const getInventory = async () => {
            const inventory_ = await inventoryService.get({}, onError);
            setInventory(inventory_);
            setIsLoading(false);
        };

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
                    <button className="add-button" onClick={() => context.onNavigate('addInventory', {inventory:inventory})}>
                        +
                    </button> 
                </div>
            </div>
            <div className="card-content">
                {inventory.map((item) => {
                    return (
                        <React.Fragment key={item.id}>
                            <InventoryComponent 
                                item={item}
                                context={context}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
