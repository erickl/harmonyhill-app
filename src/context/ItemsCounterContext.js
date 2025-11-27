import React, { createContext, useState, useContext, useEffect } from "react";
import "../components/ItemsCounterModal.css";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from 'lucide-react';
import ButtonsFooter from "../components/ButtonsFooter.js";
import * as utils from "../utils.js";
import {getPhotoUrl} from "../daos/storageDao.js";
import * as inventoryService from "../services/inventoryService.js";
import { useNotification } from "./NotificationContext.js";

const ItemsCounterContext = createContext();

export function ItemsCounterProvider({ children }) {

    const [items, setItems] = useState([]);
    const [reservedStock, setReservedStock] = useState({});
    const [totalStock, setTotalStock] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [quantityText, setQuantityText] = useState("");
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
    const [onSubmit, setOnSubmit] = useState(null);
    const [includeZeroCounts, setIncludeZeroCounts] = useState(true);

    const {onError} = useNotification();

    useEffect(() => {
        const currentItem = items.length > currentIndex ? items[currentIndex] : null;
        generateItemCountText(currentItem);
    }, [currentIndex, reservedStock, items]);

    const onCountItems = (itemsInput, reservedStock, includeZeroCounts, onSubmit) => {
        const newItems = itemsInput.map((item) => {
            if(!utils.exists(item, "quantity")) item.quantity = 0;
            return item;
        });

        setItems(newItems); 
        setReservedStock(reservedStock);
        setIncludeZeroCounts(includeZeroCounts);
        setOnSubmit(() => onSubmit);
    }

    const getItemCount = async(item) => {
        const itemReservedStock = utils.exists(reservedStock, item.name) ? reservedStock[item.name] : 0;
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
        const counts = await getItemCount(currentItem);
        let updatedQuantityText = `${currentItem.quantity}/${counts.available}`;
        if(counts.available < counts.total) {
            updatedQuantityText += ` (used ${counts.total})`;
        }
        setQuantityText(updatedQuantityText);
    }

    const onChangeCount = async (newQuantity) => {
        let newItems = [ ...(items || []) ];
        const counts = await getItemCount(currentItem);
        if(newQuantity <= counts.available) {
            newItems[currentIndex].quantity = utils.cleanNumeric(newQuantity);
            setItems(newItems);
        }
    }
    
    const hidePopup = () => {
       setItems([]);
       setCurrentPhotoUrl(null);
       setCurrentIndex(0);
       setTotalStock({});
       setReservedStock({});
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
        const newCurrentIndex = (currentIndex + 1) % items.length;
        setCurrentIndex(newCurrentIndex);
    }

    const onShowPrevious = () => {
        const newCurrentIndex = (Math.abs(currentIndex - 1)) % items.length;
        setCurrentIndex(newCurrentIndex);
    }

    const onSubmitCount = async() => {
        if(!onSubmit) return;

        let itemsToReturn = items;

        if(!includeZeroCounts) {
            itemsToReturn = itemsToReturn.filter((item) => item && utils.exists(item, "quantity") && item.quantity > 0);
        }
        
        const result = await onSubmit(itemsToReturn);
        
        if(result !== false) {
            hidePopup();
        }
    }

    useEffect(() => {
        const getCurrentPhotoUrl = async() => {
            if(items && items.length > currentIndex) {
                const photoUrl = items[currentIndex].photoUrl;
                const currentPhotoUrl = await getPhotoUrl(photoUrl);
                setCurrentPhotoUrl(currentPhotoUrl);
            }
        }
        getCurrentPhotoUrl();
    });

    let currentQuantity = 0;
    if(items && items.length > currentIndex && utils.exists(items[currentIndex], "quantity")) {
        currentQuantity = items[currentIndex].quantity;
    }

    const currentItem = items && Array.isArray(items) && items.length > 0 ? items[currentIndex] : null;
    
    return (
        <ItemsCounterContext.Provider value={{ onCountItems }}>
            {children}
            {currentItem && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{"Count Items"}</h2>
                            <div className="image-box">
                                {!utils.isEmpty(currentItem.image) ? (
                                    <img src={currentPhotoUrl} alt="minibar-image" />
                                ) : (
                                    <div className="image-placeholder" />
                                )}
                            </div>
                            <p>{currentItem.name}</p>
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
                    </div>
                </div>
            )}
        </ItemsCounterContext.Provider>
    );
}

export function useItemsCounter() {
    return useContext(ItemsCounterContext);
}
