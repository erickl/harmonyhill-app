
import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
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

        // e.g. for custom dishes, must give name before setting quantity 
        if(utils.isEmpty(newDish.name)) {
            onError(`Missing dish name data...`);
            return;
        }

        let existingDishIndex = updatedDishes.findIndex((dish) => {
            return dish.name === newDish.name && dish.course === newDish.course;
        })

        if(existingDishIndex === -1) {
            newDish.quantity = 0;
            existingDishIndex = updatedDishes.push(newDish) - 1;
        } 

        updatedDishes[existingDishIndex].isFree = isFree;
        updatedDishes[existingDishIndex].quantity += quantity;
        updatedDishes[existingDishIndex].quantity = Math.max(updatedDishes[existingDishIndex].quantity, 0);

        if(updatedDishes[existingDishIndex].quantity == 0) {
            updatedDishes = updatedDishes.filter((_, i) => i !== existingDishIndex);
        } 
        
        handleFormDataChange("dishes", updatedDishes);
    };

    const handleEditCustomOrderName = (newDish, newName) => {
        let updatedDishes = [ ...(formData.dishes || []) ]; // Make shallow copy

        let existingDishIndex = utils.isEmpty(newDish.name) ? -1 : updatedDishes.findIndex((dish) => {
            return dish.name === newDish.name;
        })

        if(existingDishIndex === -1) {
            newDish.quantity = 1;
            existingDishIndex = updatedDishes.push(newDish) - 1;
        }

        updatedDishes[existingDishIndex].name = newName;

        // If the name is removed, remove the dish
        if(utils.isEmpty(newName)) {
            updatedDishes = updatedDishes.filter((_, i) => i !== existingDishIndex);
        }

        handleFormDataChange("dishes", updatedDishes);
    };

    const handleEditOrder = (newDish, field, value) => {
        let updatedDishes = [ ...(formData.dishes || []) ];

        let existingDishIndex = updatedDishes.findIndex((dish) => {
            return dish.name === newDish.name && dish.course === newDish.course;
        })

        if(field === "customerPrice") {
            value = utils.cleanNumeric(value); 
        }

        if(existingDishIndex === -1) {
            existingDishIndex = updatedDishes.push(newDish) - 1;;
        }

        updatedDishes[existingDishIndex][field] = value;
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
    </>);
}
