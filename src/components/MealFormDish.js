
import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import { Trash2} from "lucide-react";
import "./MealFormDish.css"

export default function MealFormDish({dish, formData, handleFormDataChange, custom, isFree}) {
    
    const getDishData = (fieldName, defaultValue) => {
        let existingDishIndex = formData.dishes.findIndex((d) => {
            return d.name === dish.name && d.course === dish.course;
        })
        if(existingDishIndex === -1) {
            return defaultValue;
        }
        return utils.isEmpty(formData.dishes[existingDishIndex][fieldName]) ? defaultValue : formData.dishes[existingDishIndex][fieldName];
    }

    const { onError } = useNotification();

    const handleEditOrderQuantity = (newDish, quantity) => {
        let updatedDishes = [ ...(formData.dishes || []) ];

        let existingDishIndex = updatedDishes.findIndex((dish) => {
            //return dish.name === newDish.name && dish.course === newDish.course;
            return dish.id === newDish.id;
        })

        if(existingDishIndex === -1) {
            newDish.quantity = 0;
            newDish.isFree = isFree;
            existingDishIndex = updatedDishes.push(newDish) - 1;
        } 

        updatedDishes[existingDishIndex].quantity += quantity;
        updatedDishes[existingDishIndex].quantity = Math.max(updatedDishes[existingDishIndex].quantity, 0);

        if(updatedDishes[existingDishIndex].quantity == 0) {
            updatedDishes = updatedDishes.filter((_, i) => i !== existingDishIndex);
        } 
        
        handleFormDataChange("dishes", updatedDishes);
    };

    const handleEditOrder = (newDish, field, value) => {
        let updatedDishes = [ ...(formData.dishes || []) ];

        let existingDishIndex = updatedDishes.findIndex((dish) => {
            return dish.name === newDish.name && dish.course === newDish.course;
        })

        if(existingDishIndex === -1) {
            existingDishIndex = updatedDishes.push(newDish) - 1;
        }

        if(field === "customerPrice") {
            value = utils.cleanNumeric(value); 
        }

        // If editing name (for custom dishes)
        if(field === "name") {
            if(utils.isEmpty(newDish.name) && newDish.quantity === 0) {
                newDish.quantity = 1;
            }
            if(utils.isEmpty(value)) {
                newDish.quantity = 0;
            }
        }

        updatedDishes[existingDishIndex][field] = value;
        handleFormDataChange("dishes", updatedDishes);
    };

    const quantity = getDishData("quantity", 0);

    const dishPrice = isFree ? "" : ` (${utils.formatDisplayPrice(dish.customerPrice, false)})`;

    return (<>
        <div className="meal-dish" key={`${dish.id}-wrapper`}>
            <div className="meal-dish-row" key={`${dish.id}-wrapper-row`}>
                {custom === true ? (
                    <div className="custom-meal-dish-row">
                        <Trash2 color="red" onClick={() => {
                            handleEditOrderQuantity(dish, -dish.quantity);
                        }}/>
                        <label for={`${dish.id}-name`}>
                            Custom Name:
                        </label>
                        <input
                            type="text"
                            id={`${dish.id}-name`}
                            name={`name`}
                            value={dish.name}
                            onChange={(e) => handleEditOrder(dish, "name", e.target.value)}
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
                    <span>{`${dish.name}${dishPrice}`}</span>
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
    </>);
}
