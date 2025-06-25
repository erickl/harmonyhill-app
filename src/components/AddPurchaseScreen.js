import React, { useState, useEffect } from 'react';
// import { Pencil } from 'lucide-react';
import * as activityService from '../services/activityService.js'; 
import * as mealService from '../services/mealService.js';
import * as menuService from '../services/menuService.js';
import * as utils from '../utils.js';
import DishesPopup from "./DishesPopup.js";
import { loadBundle } from 'firebase/firestore';
import "./AddPurchaseScreen.css";

const AddPurchaseScreen = ({ customer, onClose, onNavigate }) => {

    // State to track the currently selected activity (for the purchase form)
    const [selectedActivity, setSelectedActivity] = useState(null);

    // State to track the currently selected category
    const [selectedCategory, setSelectedCategory] = useState(null);

    // State to hold the menu items (activities)
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    const [menuError, setMenuError] = useState(null); // to handle errors with loading the menu   
    
    const [showPopup, setShowPopup] = useState(false);
    const [selectedDishes, setSelectedValue] = useState(null);

    const handleEditOrder = (dishes, newDish, amount) => {
        const updatedDishes = { ...(dishes || {}) }; // Make shallow copy
      
        if (!updatedDishes[newDish.name]) updatedDishes[newDish.name] = 0;
        updatedDishes[newDish.name] += amount;
        updatedDishes[newDish.name] = Math.max(updatedDishes[newDish.name], 0);
      
        setSelectedValue(updatedDishes);
        setShowPopup(false);
    };

    // State for the purchase form data
    const [purchaseFormData, setPurchaseFormData] = useState({
        date: '',
        time: '',
        comments: '',
        price: '',
    });


    // fetch the menu items when the component mounts or customerID changes (ensuring updates come through without restarting the app)
    // fetching sub categories to choose from
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
                const menuData = await activityService.getMenu();
                let categories = menuData.map(item => item.category);
                // getMenu() gets all sub categories (e.g. lunch, dinner), so a category (e.g. meal) can occur multiple times
                categories = Array.from(new Set(categories));
                
                setCategories(categories);
                setMenuItems(menuData);
                setLoadingMenu(false);
            } catch (err) {
                console.error("Failed to fetch menu:", err);
                setMenuError(err);
                setLoadingMenu(false);
            }     
        }   

        load();
    }, [customer?.id]); // Dependency array: re-run this effect if the customer's ID changes

        // Initialize purchaseFormData.price when selectedActivity changes
        useEffect(() => {
            const load = async () => {
                // Only fetch if a customer is provided, as the screen is for adding purchases for a customer
                if (!customer) {
                    setLoadingMenu(false);
                    return;
                }

                if(selectedActivity && selectedCategory === "meal") {
                    const allDishes = await menuService.get({"mealCategory" : selectedActivity.subCategory});
                    setAllDishes(allDishes);
                }
                else if (selectedActivity) {
                    setPurchaseFormData(prevData => ({
                        ...prevData,
                        price: selectedActivity.price || '', // Set initial price from selected activity, or empty string
                    }));
                }
            }
            load();

    }, [selectedActivity]);

    const handlePurchaseFormChange = (e) => {
        const { name, value } = e.target;

        // Special handling for price to ensure it's a number
        // Special handling for price: Convert to number after removing non-digit characters
        if (name === 'price') {
            // Remove all non-digit characters (commas, dots, currency symbols, etc.)
            const cleanValue = value.replace(/[^0-9]/g, '');
            // Convert to integer; use empty string if input is empty
            const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
            setPurchaseFormData(prevData => ({ ...prevData, [name]: numericValue }));
        } else {
            setPurchaseFormData({ ...purchaseFormData, [name]: value });
        }
    };


    // Handler for submitting the purchase form
    const handlePurchaseSubmit = (e) => {
        e.preventDefault();
        // Here you would typically save the purchase to the database
        // using selectedActivity.category, selectedActivity.subcategory, selectedActivity.price,
        // and purchaseFormData.date, purchaseFormData.time, purchaseFormData.comments
        console.log("Purchase Details:", {
            customer: customer.name,
            activity: selectedActivity.name,
            price: purchaseFormData.price,
            date: purchaseFormData.date,
            time: purchaseFormData.time,
            comments: purchaseFormData.comments,
        });
        alert(`Purchase for ${selectedActivity.name} added for ${customer.name} on ${purchaseFormData.date} at ${purchaseFormData.time}`);
        // After successful purchase, you might want to close the screen or reset states
        setSelectedActivity(null); // Go back to subcategory selection
        setPurchaseFormData({ date: '', time: '', comments: '' }); // Reset form
        // onClose(); // Or close the whole screen
    };


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


    // --- Render meal dishes selection
    if (selectedActivity && selectedCategory === "meal") {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <span className="ml-2">Choose Activity</span>
                    </h2>
                </div>
                <div className="card-content">

                    {/* Display total order thus far */}
                    {selectedDishes ? (<>
                         <p>You selected:</p>
                        {Object.entries(selectedDishes).filter(([_, count]) => count > 0).map(([dish, count]) => (
                            <div key={`${dish}-selected-wrapper`}>
                                {<p>{count}x {dish}</p>}
                            </div>
                        ))}
                    </>) : null}
                    <h3>Items in {selectedCategory}:</h3>

                    {/* Display all dishes, inc/dec buttons, and how many of each dish */}
                    {allDishes.length > 0 ? (
                        <div className="activity-button-container">
                            {allDishes.map((dish) => (
                                <div className="meal-dish-row" key={`${dish.id}-wrapper`}>
                                    <span>{dish.name}</span>
                                    <button
                                        key={`${dish.id}-increment`}
                                        //className="button activity-button"
                                        onClick={() => {
                                            handleEditOrder(selectedDishes, dish, 1);
                                        }}>
                                        +
                                    </button>
                                    <span>{selectedDishes && selectedDishes[dish.name] ? selectedDishes[dish.name] : 0}</span>
                                    <button
                                        key={`${dish.id}-increment`}
                                        //className="button activity-button"
                                        onClick={() => {
                                            handleEditOrder(selectedDishes, dish, -1);
                                        }}>
                                        -
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                       <p>No dishes found</p>
                    )}
                   
                </div>
                {/* todo <div className="form-group">
                    <label htmlFor="startingAt">Check Out Date</label>
                    <MyDatePicker name={"startingAt"} value={formData.startingAt} onChange={handleOtherInputChange}/>
                </div> */}
                <div className="buttons-footer">
                    <button type="button" onClick={() => setSelectedActivity(null)} className="cancel-button">
                        Back to activities
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={ () => mealService.addMeal(customer.id, {
                            "category"    : selectedCategory,
                            "subCategory" : selectedActivity,
                            "dishes"      : selectedDishes,
                            "status"      : "requested"
                        })}
                    >
                        Submit
                    </button>
                </div>
            </div>
        )
    }


    // --- Render Purchase Form ---
    if (selectedActivity) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <span className="ml-2">Add Purchase: {selectedActivity.subCategory}</span>
                    </h2>
                </div>
                <div className="card-content">
                    <h3>Confirm Purchase Details:</h3>
                    <form onSubmit={handlePurchaseSubmit}>
                        <div className="purchase-form-group">
                            <label>Activity: {selectedActivity.subCategory}</label>
                            {/* <input type="text" value={selectedActivity.subCategory} readOnly /> */}
                        </div>
                        <div className="purchase-form-group">
                            <label htmlFor="purchasePrice">Price:</label>
                            <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                                <span className="currency-prefix">Rp</span>
                                <input
                                    type="text" // Changed from "number" to "text"
                                    id="purchasePrice"
                                    name="price"
                                    // Apply formatting here for display inside the input
                                    value={
                                        typeof purchaseFormData.price === 'number' && !isNaN(purchaseFormData.price)
                                            ? purchaseFormData.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                            : ''
                                    }
                                    onChange={handlePurchaseFormChange}
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="purchase-form-group">
                            <label htmlFor="purchaseDate">Date:</label>
                            <input
                                type="date"
                                id="purchaseDate"
                                name="date"
                                value={purchaseFormData.date}
                                onChange={handlePurchaseFormChange}
                                required
                                className="input"
                            />
                        </div>
                        <div className="purchase-form-group">
                            <label htmlFor="purchaseTime">Time:</label>
                            <input
                                type="time"
                                id="purchaseTime"
                                name="time"
                                value={purchaseFormData.time}
                                onChange={handlePurchaseFormChange}
                                className="input"
                            />
                        </div>
                        <div className="purchase-form-group">
                            <label htmlFor="purchaseComments">Comments:</label>
                            <textarea
                                id="purchaseComments"
                                name="comments"
                                value={purchaseFormData.comments}
                                onChange={handlePurchaseFormChange}
                                rows="3"
                                className="input"
                            ></textarea>
                        </div>
                        <div className="purchase-form-actions">
                            <button type="submit">Add Purchase</button>
                            {/* <button type="button" onClick={() => setSelectedActivity(null)} className="button">Cancel</button> */}
                        </div>
                    </form>
                </div>

                <div>
                    <button type="button" onClick={() => setSelectedActivity(null)} className="cancel-button">
                        Back to activities</button>
                </div>
            </div>
        );
    }

    // --- Render Activities within Selected Category ---

    if (selectedCategory) {
        console.log('Rendering: activity picker');

        const filteredItems = menuItems.filter(item => item.category === selectedCategory);

        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <span className="ml-2">Choose Activity</span>
                    </h2>
                </div>
                <div className="card-content">
                    <h3>Items in {selectedCategory}:</h3>
                    {filteredItems.length > 0 ? (
                        <div className="activity-button-container">
                            {filteredItems.map((item) => (
                                <div key={`${item.category}-${item.subCategory}-wrapper`}>
                                    <button
                                        key={`${item.category}-${item.subCategory}`}
                                        className="button activity-button"
                                        onClick={() => {
                                            setSelectedActivity(item)
                                        }}
                                    >
                                        {item.subCategory} <br></br>Rp {item.price ? item.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'N/A'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No items found in this category.</p>
                    )}
                </div>
                <div>
                    <button type="button" onClick={() => setSelectedCategory(null)} className="cancel-button">
                        Back to categories</button>
                </div>
            </div >
        )
    }

    // --- Render Category Buttons (default view) ---
    return (
        <div className="card add-purchase-card">
            <div className="card-header">
                <h2 className="card-title">Add Purchase for {customer ? customer.name : 'Customer'}</h2>
            </div>
            <div className="card-content">
                <h3>Select a Category:</h3>
                {categories.length > 0 ? (
                    <div className="category-buttons-container">
                        {categories.map((category) => (
                            <div key={category}><button
                                className="category-button"
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button></div>
                        ))}
                    </div>
                ) : (
                    <p>No categories available.</p>
                )}

            </div>
            <div><button type="button" onClick={onClose} className="cancel-button">Cancel</button></div>
        </div>
    );

};
export default AddPurchaseScreen;