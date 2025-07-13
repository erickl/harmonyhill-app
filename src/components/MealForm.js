import React, { useState, useEffect } from 'react';
import "./MealForm.css";
import MyDatePicker from "./MyDatePicker.js";
import * as menuService from '../services/menuService.js';
import ErrorNoticeModal from './ErrorNoticeModal.js';

export default function MealForm({selectedActivity, formData, handleFormDataChange }) {
    
    const [allDishes, setAllDishes] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    
    const [errorMessage, setErrorMessage] = useState(null);
            
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const dishQuantity = (dishName) => {
        return formData.dishes && formData.dishes[dishName] ? formData.dishes[dishName].quantity : 0
    }

    const dishComments = (dishName) => {
        return formData.dishes && formData.dishes[dishName] ? formData.dishes[dishName].comments : "";
    }

    const handleEditOrderQuantity = (newDish, quantity) => {
        const updatedDishes = { ...(formData.dishes || {}) }; // Make shallow copy
        
        if (!updatedDishes[newDish.name]) {
            updatedDishes[newDish.name] = newDish;
            updatedDishes[newDish.name].quantity = 0;
        }

        updatedDishes[newDish.name].quantity += quantity;
        updatedDishes[newDish.name].quantity = Math.max(updatedDishes[newDish.name].quantity, 0);
        
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
            const allDishes = selectedActivity ? await menuService.get({"mealCategory" : selectedActivity.subCategory}) : [];
            setAllDishes(allDishes);
            setLoadingMenu(false);
        }
        load();
    }, []);

    if (loadingMenu) {
        return (<div><p>Loading menu items...</p></div>);
    }

    return (
        <div>
            <h3>Items in meal:</h3>
            {/* Display all dishes, inc/dec buttons, and how many of each dish */}
            {allDishes.length > 0 ? (
                <div className="activity-button-container">
                    {allDishes.map((dish) => (
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
                                    <span>{dishQuantity(dish.name)}</span>
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
                            {dishQuantity(dish.name) > 0 && (<div>
                                <label htmlFor="purchaseComments">Comments:</label>
                                <textarea
                                    id="purchaseComments"
                                    name="comments"
                                    value={dishComments(dish.name)}
                                    onChange={(e) => handleEditOrder(dish, e.target.name, e.target.value)}
                                    rows="1"
                                    className="input"
                                ></textarea>
                            </div>
                        )}
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
