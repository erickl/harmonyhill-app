
import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import { Trash2} from "lucide-react";
import TextInput from "./TextInput.js";
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

    const handleEditOrderQuantity = (quantity) => {
        let newDishes = [ ...(formData.dishes || []) ];

        let existingDishIndex = newDishes.findIndex((item) => {
            return item.id === dish.id || item.name === dish.name;
        })

        if(existingDishIndex === -1) {
            dish.quantity = 0;
            dish.isFree = isFree;
            existingDishIndex = newDishes.push(dish) - 1;
        } 

        newDishes[existingDishIndex].quantity += quantity;
        newDishes[existingDishIndex].quantity = Math.max(newDishes[existingDishIndex].quantity, 0);

        if(newDishes[existingDishIndex].quantity == 0) {
            newDishes = newDishes.filter((_, i) => i !== existingDishIndex);
        } 
        
        handleFormDataChange("dishes", newDishes);
    };

    const handleEditOrder = (field, value) => {
        let newDishes = [ ...(formData.dishes || []) ];

        let existingDishIndex = newDishes.findIndex((newDish) => {
            return dish.name === newDish.name && dish.course === newDish.course;
        })

        if(existingDishIndex === -1) {
            existingDishIndex = newDishes.push(dish) - 1;
        }

        if(field === "customerPrice") {
            value = utils.cleanNumeric(value); 
        }

        // If editing name (for custom dishes)
        if(field === "name") {
            if(utils.isEmpty(dish.name) && dish.quantity === 0) {
                dish.quantity = 1;
            }
            if(utils.isEmpty(value)) {
                dish.quantity = 0;
            }
        }

        newDishes[existingDishIndex][field] = value;
        handleFormDataChange("dishes", newDishes);
    };

    const quantity = getDishData("quantity", 0);

    const dishPrice = isFree ? "" : ` (${utils.formatDisplayPrice(dish.customerPrice, false)})`;

    return (<>
        <div className="meal-dish" key={`${dish.id}-wrapper`}>
            <div className="meal-dish-row" key={`${dish.id}-wrapper-row`}>
                {custom === true ? (
                    <div className="custom-meal-dish-row">
                        <Trash2 color="red" onClick={() => {
                            handleEditOrderQuantity(-dish.quantity);
                        }}/>
                        <TextInput 
                            type="text"
                            name="name"
                            label={"Custom Name"}
                            value={dish.name}
                            onChange={handleEditOrder}
                        />
                        <TextInput 
                            type="price"
                            name="customerPrice"
                            label={"Price"}
                            value={utils.formatDisplayPrice(dish.customerPrice)}
                            onChange={handleEditOrder}
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
                            handleEditOrderQuantity(-1);
                        }}>
                        -
                    </button>
                    <span>{quantity}</span>
                    <button
                        key={`${dish.id}-increment`}
                        //className="button activity-button"
                        onClick={() => {
                            handleEditOrderQuantity(1);
                        }}>
                        +
                    </button>
                </div>
            </div>

            {quantity > 0 && (
                <div className="meal-dish-comment">
                    <TextInput 
                        type="text"
                        name="comments"
                        label={"Comments"}
                        value={getDishData("comments", "")}
                        onChange={handleEditOrder}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={getDishData("isFree", false)}
                                onChange={(e) => handleEditOrder("isFree", e.target.checked)}
                            />
                        }
                        label="Free"
                    />
                </div>
            )}
        </div>
    </>);
}
