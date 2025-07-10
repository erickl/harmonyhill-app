import React, { useState, useEffect } from 'react';
import "./MealForm.css";
import MyDatePicker from "./MyDatePicker.js";
import * as menuService from '../services/menuService.js';

export default function MealForm({ selectedActivity, selectedDishes, setSelectedDishes, formData, handleFormDataChange  }) {
    
    const [allDishes, setAllDishes] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    const [menuError, setMenuError] = useState(null); // to handle errors with loading the menu   

    const dishQuantity = (dishName) => {
        return selectedDishes && selectedDishes[dishName] ? selectedDishes[dishName].quantity : 0
    }

    const handleEditOrderQuantity = (newDish, quantity) => {
        const updatedDishes = { ...(selectedDishes || {}) }; // Make shallow copy
        
        if (!updatedDishes[newDish.name]) {
            updatedDishes[newDish.name] = newDish;
            updatedDishes[newDish.name].quantity = 0;
        }

        updatedDishes[newDish.name].quantity += quantity;
        updatedDishes[newDish.name].quantity = Math.max(updatedDishes[newDish.name].quantity, 0);
        
        setSelectedDishes(updatedDishes);
    };

    const handleEditOrder = (newDish, field, value) => {
        const updatedDishes = { ...(selectedDishes || {}) }; // Make shallow copy
        
        if (!updatedDishes[newDish.name]) {
            return;
        }

        updatedDishes[newDish.name][field] = value;
        setSelectedDishes(updatedDishes);
    };

    useEffect(() => {
        const load = async () => {
            const allDishes = await menuService.get({"mealCategory" : selectedActivity.subCategory});
            setAllDishes(allDishes);
            setLoadingMenu(false);
        }
        load();
    }, []);

    if (loadingMenu) {
        return (<div><p>Loading menu items...</p></div>);
    }

    if (menuError) {
        return (<div><p>Error loading menu: {menuError.message}</p></div>);
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
                                    value={dish.comments}
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
        </div>
    );
}
