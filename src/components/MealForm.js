import React, { useState, useEffect } from 'react';
import "./MealForm.css";
import MyDatePicker from "./MyDatePicker.js";
import * as menuService from '../services/menuService.js';
import * as utils from "../utils.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';

export default function MealForm({selectedActivity, formData, handleFormDataChange }) {
    
    const [allDishes, setAllDishes] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    
    const [errorMessage, setErrorMessage] = useState(null);
            
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const getDishData = (dishName, fieldName, defaultValue) => {
        return formData.dishes && formData.dishes[dishName] ? formData.dishes[dishName][fieldName] : defaultValue;
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

    useEffect(() => {
        const load = async () => {
            const allDishes = selectedActivity ? await menuService.groupByCourse({
                "meal" : selectedActivity.subCategory},
            ) : [];
            setAllDishes(allDishes);
            setLoadingMenu(false);
        }
        load();
    }, [selectedActivity]);

    if (loadingMenu) {
        return (<div><p>Loading menu items...</p></div>);
    }

    // Sort appearance of meals by meal categories, i.e. first starters, then mains, lastly coffee, etc..
    const sortedMealNames = Object.keys(allDishes).sort((a, b) => a.localeCompare(b));

    return (
        <div>
            <h3>Items in meal</h3>
            {/* Display all dishes, inc/dec buttons, and how many of each dish */}
            {Object.entries(allDishes).length > 0 ? (
                <div className="activity-button-container">

                    {/* Dishes grouped by meals (Starters, main, desserts, etc...) */}
                    {sortedMealNames.map((course) => (
                        <div key={`${course}-wrapper`}>
                            <h2>{utils.capitalizeWords(course.split(",")[1])}</h2>

                            {/* Each dish has a counter, incrementor, a comment field, and other options */}
                            {allDishes[course].map((dish) => (
                                <div className="meal-dish" key={`${dish.id}-wrapper`}>
                                    <div className="meal-dish-row" key={`${dish.id}-wrapper-row`}>
                                        <span>{dish.name}</span>
                                        <div className="meal-dish-row-counter">
                                            <button
                                                key={`${dish.id}-increment`}
                                                //className="button activity-button"
                                                onClick={() => {
                                                    handleEditOrderQuantity(dish, -1);
                                                }}>
                                                -
                                            </button>
                                            <span>{getDishData(dish.name, "quantity", 0)}</span>
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
                                    {getDishData(dish.name, "quantity", 0) > 0 && (
                                        <div>
                                            <label htmlFor="purchaseComments">Comments:</label>
                                            <textarea
                                                id="purchaseComments"
                                                name="comments"
                                                value={getDishData(dish.name, "comments", "")}
                                                onChange={(e) => handleEditOrder(dish, e.target.name, e.target.value)}
                                                rows="1"
                                                className="input"
                                            ></textarea>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={getDishData(dish.name, "isFree", false)}
                                                        onChange={(e) => handleEditOrder(dish, "isFree", e.target.checked)}
                                                    />
                                                }
                                                label="Free"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <p>No dishes found</p>
            )}

            <MyDatePicker name={"startingAt"} value={formData.startingAt} onChange={handleFormDataChange}/>

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
}
