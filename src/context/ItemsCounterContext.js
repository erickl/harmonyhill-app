import React, { createContext, useState, useContext, useEffect } from "react";
import "../components/ItemsCounterModal.css";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from 'lucide-react';
import ButtonsFooter from "../components/ButtonsFooter.js";
import * as utils from "../utils.js";
import {getPhotoUrl} from "../daos/storageDao.js";

const ItemsCounterContext = createContext();

export function ItemsCounterProvider({ children }) {

    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
    const [onSubmit, setOnSubmit] = useState(null);

    const onCountItems = (items, onSubmit) => {
        setItems(items); 
        setOnSubmit(() => onSubmit);
    }

    const onChangeCount = (newQuantity) => {
        let newItems = [ ...(items || []) ];
        newItems[currentIndex].quantity = utils.cleanNumeric(newQuantity);
        setItems(newItems);
    }
    
    const hidePopup = () => {
       setItems([]);
       setCurrentPhotoUrl(null);
       setCurrentIndex(0);
    }

    const onShowNext = () => {
        setCurrentIndex((currentIndex + 1) % items.length);
    }

    const onShowPrevious = () => {
        setCurrentIndex((Math.abs(currentIndex - 1)) % items.length);
    }

    const onSubmitCount = async() => {
        if(!onSubmit) return;
        const nonZeroItems = items.filter((item) => item && utils.exists(item, "quantity") && item.quantity > 0);
        const result = await onSubmit(nonZeroItems);
        
        if(result === true) {
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
    
    return (
        <ItemsCounterContext.Provider value={{ onCountItems }}>
            {children}
            {items && items.length > 0 && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{"Count Items"}</h2>
                        {items[currentIndex] && (<>
                            <div className="image-box">
                                {!utils.isEmpty(items[currentIndex].image) ? (
                                    <img src={currentPhotoUrl} alt="minibar-image" />
                                ) : (
                                    <div className="image-placeholder" />
                                )}
                            </div>
                            <p>{items[currentIndex].name}</p>
                            <div className="nav-controls">
                                <ArrowBigLeftIcon onClick={(e) => {
                                    e.stopPropagation();
                                    onShowPrevious();
                                }}/>
                                <h2>{currentQuantity}</h2>
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
                        </>)}
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
