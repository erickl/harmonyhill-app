
import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import MyDatePicker from "./MyDatePicker.js";
import * as utils from '../utils.js';
import * as mealService from "../services/mealService.js"; 
import * as activityService from "../services/activityService.js"; 
import * as menuService from "../services/menuService.js"; 
import "./EditPurchaseScreen.css";
import "../App.css";

const EditPurchaseScreen = ({ customer, activity, onClose, onNavigate }) => {

    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    const [menuError, setMenuError] = useState(null); // to handle errors with loading the menu  
    const [menuItems, setMenuItems] = useState([]); 
    const [allDishes, setAllDishes] = useState([]);

    const [formData, setFormData] = useState({
        startingAt : activity.startingAt,
        comments   : activity.comments,
        price      : activity.price, // not editable for meals. Derived from the dishes' costs 
        provider   : activity.provider,
        assignedTo : activity.assignedTo,
        status     : activity.status, // not editable. Edits automatically when provider is assigned
           
        dishes     : activity.dishes, // not null only for meal activities 
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleOtherInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value }); 
    };

    const dishQuantity = (dishName) => {
        return formData.dishes && formData.dishes[dishName] ? formData.dishes[dishName].quantity : 0
    }

    const dishComments = (dishName) => {
        return formData.dishes && formData.dishes[dishName] ? formData.dishes[dishName].comments : "";
    }

    const handleEditOrderQuantity = (newDish, quantity) => {
        const updatedFormData = { ...(formData || {}) }; // Make shallow copy
        
        if(!updatedFormData.dishes) {
            updatedFormData.dishes = {};
        }
      
        if (!updatedFormData.dishes[newDish.name]) {
            updatedFormData.dishes[newDish.name] = newDish;
            updatedFormData.dishes[newDish.name].quantity = 0;
        }

        updatedFormData.dishes[newDish.name].quantity += quantity;
        updatedFormData.dishes[newDish.name].quantity = Math.max(updatedFormData.dishes[newDish.name].quantity, 0);
      
        setFormData(updatedFormData);
    };

    const handleEditOrder = (newDish, field, value) => {
        const updatedFormData = { ...(formData || {}) }; // Make shallow copy
      
        if (!updatedFormData.dishes[newDish.name]) {
            return;
        }

        updatedFormData.dishes[newDish.name][field] = value;
        setFormData(updatedFormData);
    };


    const handleEditPurchaseSubmit = async() => {
        const editActivitySuccess = await mealService.update(customer.id, activity.id, formData);
        if(editActivitySuccess) {
            onClose();
        } else {
            console.log("Something went wrong..."); // todo: display error properly
        }
    };

    useEffect(() => {
        const load = async () => {
            // Only fetch if a customer is provided, as the screen is for adding purchases for a customer
            if (!customer) {
                setLoadingMenu(false);
                return;
            }
            setLoadingMenu(true); // Set loading to true before fetching
            setMenuError(null); // Clear previous errors

            try {
                if(activity && activity.category === "meal") {
                    const allDishes = await menuService.get({"mealCategory" : activity.subCategory});
                    setAllDishes(allDishes);
                }
      
                setLoadingMenu(false);
            } catch (err) {
                console.error("Failed to fetch menu:", err);
                setMenuError(err);
                setLoadingMenu(false);
            }     
        }   

        load();
    }, [customer?.id]); // Dependency array: re-run this effect if the customer's ID changes
    

    // --- Render Purchase Form ---
    if (activity.category == "meal") {
        if (loadingMenu) {
            return (
                <div className="card">
                    <div className="card-content">
                        <p>Loading menu items...</p>
                    </div>
                </div>
            );
        }
    
        if (menuError) {
            return (
                <div className="card">
                    <div className="card-content">
                        <p>Error loading menu: {menuError.message}</p>
                    </div>
                </div>
            );
        }
    
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <span className="ml-2">Edit Purchase: {activity.subCategory}</span>
                    </h2>
                </div>
                <div className="card-content">
                    <h3>Confirm Purchase Details:</h3>
                    <form onSubmit={handleEditPurchaseSubmit}>
                        <div className="purchase-form-group">
                            <label>Activity: {activity.subCategory}</label>
                            {/* <input type="text" value={activity.subCategory} readOnly /> */}
                        </div>
                        
                        <div className="form-group">
                            <MyDatePicker name={"startingAt"} value={formData.startingAt} onChange={handleOtherInputChange} required/>
                        </div>

                        <div className="purchase-form-group">
                            <label htmlFor="purchaseComments">Comments:</label>
                            <textarea
                                id="purchaseComments"
                                name="comments"
                                value={formData.comments}
                                onChange={handleInputChange}
                                rows="3"
                                className="input"
                            ></textarea>
                        </div>
                    </form>
                    <div>
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
                                ) )}
                            </div>
                        ) : (
                            <p>No dishes found</p>
                        )}
                    </div>
                </div>
                <div className="buttons-footer">
                    <button type="button" onClick={() => onClose()} className="cancel-button">
                        Back to activities
                    </button>
                    <button type="button" onClick={() => handleEditPurchaseSubmit()}>
                        Submit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <h1>Todo...</h1>
    )
};

export default EditPurchaseScreen;
