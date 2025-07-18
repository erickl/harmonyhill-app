
import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import "./MealFormDish.css"

export default function MealFormDish({dish, formData, handleFormDataChange, editable}) {

    const [errorMessage, setErrorMessage] = useState(null);
    
    const getDishData = (fieldName, defaultValue) => {
        return formData.dishes && formData.dishes[dish.name] ? formData.dishes[dish.name][fieldName] : defaultValue;
    }

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const handleEditOrderQuantity = (newDish, quantity) => {
        const updatedDishes = { ...(formData.dishes || {}) }; // Make shallow copy
        
        if (!updatedDishes[newDish.name]) {
            updatedDishes[newDish.name] = newDish;
            updatedDishes[newDish.name].quantity = 0;
        }

        updatedDishes[newDish.name].quantity += quantity;
        updatedDishes[newDish.name].quantity = Math.max(updatedDishes[newDish.name].quantity, 0);

        if(updatedDishes[newDish.name].quantity == 0) {
            delete updatedDishes[newDish.name];
        }
        
        handleFormDataChange("dishes", updatedDishes);
    };

    const handleEditOrder = (newDish, field, value) => {
        const updatedDishes = { ...(formData.dishes || {}) }; // Make shallow copy
        
        if (!updatedDishes[newDish.name]) {
            return;
        }

        updatedDishes[newDish.name][field] = value;
        handleFormDataChange("dishes", updatedDishes);
    };

    const quantity = getDishData("quantity", 0);

    return (
        <div className="meal-dish" key={`${dish.id}-wrapper`}>
            <div className="meal-dish-row" key={`${dish.id}-wrapper-row`}>
                {editable === true ? (<input
                    type="text"
                    id={`${dish.name}-input`}
                    name={`${dish.name}-input`}
                    value={dish.name}
                    //onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                    className="input"
                />) : ( 
                    <span>{dish.name}</span>
                )}
                <div className="meal-dish-row-counter">
                    <button
                        key={`${dish.id}-decrement`}
                        //className="button activity-button"
                        onClick={() => {
                            handleEditOrderQuantity(dish, -1);
                        }}>
                        -
                    </button>
                    <span>{quantity}</span>
                    <button
                        key={`${dish.id}-increment`}
                        //className="button activity-button"
                        onClick={() => {
                            handleEditOrderQuantity(dish, 1);
                        }}>
                        +
                    </button>
                </div>
            </div>

            {quantity > 0 && (
                <div>
                    <label htmlFor="purchaseComments">Comments:</label>
                    <textarea
                        id="purchaseComments"
                        name="comments"
                        value={getDishData("comments", "")}
                        onChange={(e) => handleEditOrder(dish, e.target.name, e.target.value)}
                        rows="1"
                        className="input"
                    ></textarea>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={getDishData("isFree", false)}
                                onChange={(e) => handleEditOrder(dish, "isFree", e.target.checked)}
                            />
                        }
                        label="Free"
                    />
                </div>
            )}

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
}
