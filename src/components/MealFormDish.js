
import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import "./MealFormDish.css"

export default function MealFormDish({dish, formData, handleFormDataChange, custom, isFree}) {

    const [errorMessage, setErrorMessage] = useState(null);
    
    const getDishData = (fieldName, defaultValue) => {
        return formData.dishes && formData.dishes[dish.name] && !utils.isEmpty(formData.dishes[dish.name][fieldName]) ? formData.dishes[dish.name][fieldName] : defaultValue;
    }

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const handleEditOrderQuantity = (newDish, quantity) => {
        const updatedDishes = { ...(formData.dishes || {}) }; // Make shallow copy

        // e.g. for custom dishes, must give name before setting quantity 
        if(utils.isEmpty(newDish.name)) {
            return;
        }
        
        if (!updatedDishes[newDish.name]) {
            updatedDishes[newDish.name] = newDish;
            updatedDishes[newDish.name].quantity = 0;
        }

        updatedDishes[newDish.name].isFree = isFree;
        updatedDishes[newDish.name].quantity += quantity;
        updatedDishes[newDish.name].quantity = Math.max(updatedDishes[newDish.name].quantity, 0);

        if(updatedDishes[newDish.name].quantity == 0) {
            delete updatedDishes[newDish.name];
        } 
        
        handleFormDataChange("dishes", updatedDishes);
    };

    const handleEditCustomOrderName = (newDish, newName) => {
        const updatedDishes = { ...(formData.dishes || {}) }; // Make shallow copy

        //let dishToUpdate = Object.values(updatedDishes).find((dish) => dish.id === newDish.id)

        if(updatedDishes[newDish.name]) {
            delete updatedDishes[newDish.name];
        } 

        newDish.name = newName;
        
        // At least if you give the custom dish a name, also set quantity to at least 1
        if(!utils.isEmpty(newDish.name) && newDish.quantity === 0) {
            newDish.quantity = 1;
        }

        updatedDishes[newDish.name] = newDish;

        handleFormDataChange("dishes", updatedDishes);
    };

    const handleEditOrder = (newDish, field, value) => {
        const updatedDishes = { ...(formData.dishes || {}) }; // Make shallow copy
        
        if (!updatedDishes[newDish.name]) {
            updatedDishes[newDish.name] = newDish;
        }

        if(field === "customerPrice") {
            value = utils.cleanNumeric(value); 
        }

        updatedDishes[newDish.name][field] = value;
        handleFormDataChange("dishes", updatedDishes);
    };

    const quantity = getDishData("quantity", 0);

    return (<>
        <div className="meal-dish" key={`${dish.id}-wrapper`}>
            <div className="meal-dish-row" key={`${dish.id}-wrapper-row`}>
                {custom === true ? (
                    <div>
                        <label for={`${dish.id}-name`}>
                            Custom Name:
                        </label>
                        <input
                            type="text"
                            id={`${dish.id}-name`}
                            name={`${dish.id}-name`}
                            value={dish.name}
                            onChange={(e) => handleEditCustomOrderName(dish, e.target.value)}
                            className="input"
                        />
                        <span 
                            style={{marginLeft: '10px'}}
                            className="currency-prefix">
                            {utils.getCurrency()}
                        </span>
                        <input
                            style={{marginLeft: '3px'}}
                            type="text" // Changed from "number" to "text"
                            id={`${dish.id}-customerPrice`}
                            name="customerPrice"
                            // Apply formatting here for display inside the input
                            value={utils.formatDisplayPrice(dish.customerPrice)}
                            onChange={(e) => handleEditOrder(dish, e.target.name, e.target.value)}
                            className="input"
                        />
                    </div>
                    
                ) : ( 
                    <span>{`${dish.name} (${utils.formatDisplayPrice(dish.customerPrice, false)})`}</span>
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
                <div className="meal-dish-comment">
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
        </div>

        {errorMessage && (
            <ErrorNoticeModal 
                error={errorMessage}
                onClose={() => setErrorMessage(null) }
            />
        )}
    </>);
}
