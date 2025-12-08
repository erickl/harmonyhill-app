import React, { createContext, useState, useContext, useEffect } from "react";
import "../components/ItemsCounterModal.css";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from 'lucide-react';
import ButtonsFooter from "../components/ButtonsFooter.js";
import * as utils from "../utils.js";
import {getPhotoUrl} from "../daos/storageDao.js";
import * as inventoryService from "../services/inventoryService.js";
import * as minibarService from "../services/minibarService.js";
import { useNotification } from "./NotificationContext.js";
import { update } from "../daos/userDao.js";
import Spinner from "../components/Spinner.js";

const ItemsCounterContext = createContext();

export function ItemsCounterProvider({ children }) {
    const [initState, setInitState] = useState({
        items             : [],
        type              : "",
        reservedStock     : {},
        includeZeroCounts : true,
    });

    const [counts,            setCount            ] = useState({});
    const [totalStock,        setTotalStock       ] = useState({});
    const [currentIndex,      setCurrentIndex     ] = useState(0);
    const [quantityText,      setQuantityText     ] = useState("");
    const [currentPhotoUrl,   setCurrentPhotoUrl  ] = useState(null);
    const [onSubmit,          setOnSubmit         ] = useState(null);
    const [showCounter,       setShowCounter      ] = useState(false);
    const [loading,           setLoading          ] = useState(true);

    const {onError} = useNotification();

    // Update the current displayed quantity to the user and the possible capacity for more increments
    useEffect(() => {
        const currentItem = initState.items && Array.isArray(initState.items) && initState.items.length > currentIndex ? initState.items[currentIndex] : null;
        generateItemCountText(currentItem);
    }, [currentIndex, initState, counts]);

    useEffect(() => {
        const getCurrentPhotoUrl = async() => {
            if(initState.items && Array.isArray(initState.items) && initState.items.length > currentIndex) {
                const photoUrl = initState.items[currentIndex].photoUrl;
                const currentPhotoUrl = await getPhotoUrl(photoUrl);
                setCurrentPhotoUrl(currentPhotoUrl);
            }
        }
        getCurrentPhotoUrl();
    }, [currentIndex]);

    const onCountItems = async (type, activity, existingCount, includeZeroCounts, onSubmit) => {
        setShowCounter(true);

        const stockList = await minibarService.getSelection(onError);
        if(stockList === false) return false;
                
        // When doing 'end' count, it's only important to see how many items has already been provided 
        // to that booking, because the end count can't be higher than that amount.
        // But when counting 'start' and 'refill', it's important to see how many items have been provided 
        // elsewhere in total, to see how many is still available to refill from storage
        const filter = {exceptActivityId : activity.id};
        if(type === "end") filter["house"] = activity.house;
        const reservedStock = await minibarService.getReservedStock(filter, onError);
        if(reservedStock === false) return false;

        // If there's already an existing minibar inventory count, continue with that one
        const updatedCount = {};
        if(existingCount) {
            for(const [name, quantities] of Object.entries(existingCount)) {
                updatedCount[name] = quantities.current;
            }
        }

        setCount(updatedCount);

        setInitState({
            type              : type,
            reservedStock     : reservedStock, 
            items             : stockList,
            includeZeroCounts : includeZeroCounts
        });

        setOnSubmit(() => onSubmit);
        setLoading(false);
    }

    const getItemStock = async(item) => {
        const itemReservedStock = utils.exists(initState.reservedStock, item.name) ? initState.reservedStock[item.name] : 0;
        const itemTotalStock = await getTotalStock(item.name);
        const availableStock = itemTotalStock - itemReservedStock;
        return {
            reserved  : itemReservedStock,
            total     : itemTotalStock,
            available : availableStock,
        };
    }

    const generateItemCountText = async (currentItem) => {
        if(!currentItem) return;

        const itemStock = await getItemStock(currentItem);

        const currentQuantity = utils.exists(counts, currentItem.name) ? counts[currentItem.name] : 0;

        let updatedQuantityText = `${currentQuantity}`;

        // If 'end' count, count how many the guest took, from the already reserved count of that booking
        if(initState.type === "end") {
            updatedQuantityText = `${updatedQuantityText}/${itemStock.reserved}`;
            
        // If 'start' count, count how many we can take from storage (available)
        } else { // else if type = 'start' || 'housekeeping'
            updatedQuantityText = `${currentQuantity}/${itemStock.available}`;

            // Show user how many items have already been put elsewhere
            if(itemStock.available < itemStock.total) {
                updatedQuantityText += ` (used ${itemStock.reserved})`;
            }
        }

        //setQuantityText(updatedQuantityText);
        setQuantityText(`${currentQuantity}`);
    }

    const onChangeCount = async (newQuantity) => {
        let updatedCount = { ...(counts || {}) };
        
        const currentItem = initState.items[currentIndex];
        const itemStock = await getItemStock(currentItem);

        // If 'end' count, count how many the guest took, from the reserved count of that booking
        // If 'start' count, count how many we can take from storage (available)
        let maxCount = initState.type === "end" ? itemStock.reserved : itemStock.available;

        if(newQuantity <= 999/*maxCount*/) {
            updatedCount[currentItem.name] = utils.cleanNumeric(newQuantity);
            setCount(updatedCount);
        }
    }

    const hidePopup = () => {
        setShowCounter(false); 
    }
    
    const cleanState = () => {
       setInitState({});
       setCount({});
       setCurrentPhotoUrl(null);
       setCurrentIndex(0);
       setTotalStock({}); 
       hidePopup();
    }

    const getTotalStock = async(name) => {
        let itemTotalStock = 0;
        if(utils.exists(totalStock, name)) {
            itemTotalStock = totalStock[name];
        } else {
            itemTotalStock = await inventoryService.getCurrentQuantity(name, onError);
            setTotalStock({...totalStock, [name] : itemTotalStock});
        }
        return itemTotalStock;
    }

    const onShowNext = async () => {
        const newCurrentIndex = (currentIndex + 1) % initState.items.length;
        setCurrentIndex(newCurrentIndex);
    }

    const onShowPrevious = () => {
        const newCurrentIndex = (Math.abs(currentIndex - 1)) % initState.items.length;
        setCurrentIndex(newCurrentIndex);
    }

    const onSubmitCount = async() => {
        if(!onSubmit) return;

        let updatedItems = initState.items.map((item) => {
            item.current = utils.exists(counts, item.name) ? counts[item.name] : 0;
            return item;
        });

        if(initState.includeZeroCounts === false) {
            updatedItems = updatedItems.filter((item) => item && utils.exists(item, "current") && item.current > 0);
        }

        // Add reserved stock count and total item count to the returned object
        updatedItems = updatedItems.map((item) => {
            item.reserved = utils.exists(initState.reservedStock, item.name) ? initState.reservedStock[item.name] : 0;
            item.total = utils.exists(totalStock, item.name) ? totalStock[item.name] : 0;
            return item;
        });

        const result = await onSubmit(updatedItems);
        
        if(result !== false) {
            cleanState();
        }
    }

    const currentItem = initState.items && Array.isArray(initState.items) && initState.items.length > currentIndex ? initState.items[currentIndex] : null;
    const currentQuantity = currentItem && utils.exists(counts, currentItem.name) ? counts[currentItem.name] : 0;
    
    return (
        <ItemsCounterContext.Provider value={{ onCountItems }}>
            {children}
            {showCounter && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        {!loading && currentItem ? (<>
                            <h2>{currentItem.name}</h2>
                            <div className="image-box">
                                {!utils.isEmpty(currentItem.image) ? (
                                    <img src={currentPhotoUrl} alt="minibar-image" />
                                ) : (
                                    <div className="image-placeholder" />
                                )}
                            </div>
                            <span>Quantity</span>
                            <div className="nav-controls">
                                <ArrowBigLeftIcon onClick={(e) => {
                                    e.stopPropagation();
                                    onShowPrevious();
                                }}/>
                                <h4>{quantityText}</h4>
                                <ArrowBigRightIcon onClick={(e) => {
                                    e.stopPropagation();
                                    onShowNext();
                                }}/>
                            </div>
                            <input
                                type="number"
                                value={currentQuantity}
                                name="quantity"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Enter amount"
                                className="number-input"
                                onChange={(e) => {
                                    onChangeCount(e.target.value)}
                                }
                            />
                            <ButtonsFooter onCancel={hidePopup} onSubmit={() => onSubmitCount()} submitEnabled={true} />
                        </>) : (
                            <Spinner/>
                        )}
                    </div>
                </div>
            )}
        </ItemsCounterContext.Provider>
    );
}

export function useItemsCounter() {
    return useContext(ItemsCounterContext);
}
