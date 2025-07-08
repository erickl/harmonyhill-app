import React, { useState, useEffect } from 'react';
// import { Pencil } from 'lucide-react';
import * as activityService from '../services/activityService.js'; 
import * as mealService from '../services/mealService.js';
import * as menuService from '../services/menuService.js';
import * as utils from '../utils.js';
import MyDatePicker from "./MyDatePicker.js";
import "./AddPurchaseScreen.css";

const AddPurchaseScreen = ({ customer, onClose, onNavigate }) => {

    // Show purchase summary and confirmation pop up modal
    const [showConfirm, setShowConfirm] = useState(false);

    // State to track the currently selected activity (for the purchase form)
    const [selectedActivity, setSelectedActivity] = useState(null);

    // State to track the currently selected category
    const [selectedCategory, setSelectedCategory] = useState(null);

    // State to hold the menu items (activities)
    const [categories, setCategories] = useState([]);
    const [activityMenuItems, setActivityMenuItems] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    const [menuError, setMenuError] = useState(null); // to handle errors with loading the menu   
    
    const [showPopup, setShowPopup] = useState(false);
    const [selectedDishes, setSelectedDishes] = useState(null);

    // State for the purchase form data
    const [purchaseFormData, setPurchaseFormData] = useState({
        startingAt: null,
        comments: '',
        customerPrice: '',
    });

    const onConfirmMeal = async () => {
         // todo: do some checks: check if there is already a dinner on this day. 
        // Check if the dinner is on a day which the customer is not staying there
        const addMealResult = await mealService.addMeal(customer.id, {
            "category"    : selectedCategory,
            "subCategory" : selectedActivity.subCategory,
            "dishes"      : selectedDishes,
            "status"      : "requested",
            "startingAt"  : purchaseFormData.startingAt,
        });

        if(addMealResult) {
            setSelectedCategory(null);
            setSelectedActivity(null);
            onClose();
        }
    }

    const onSubmitMeal = async () => {
        setShowConfirm(true);
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
      };

    const dishQuantity = (dishName) => {
        return selectedDishes && selectedDishes[dishName] ? selectedDishes[dishName].quantity : 0
    }

    const handleActivityPurchase = async () => {
        purchaseFormData.category = selectedCategory;
        purchaseFormData.subCategory = selectedActivity.subCategory;
        const addActivityResult = await activityService.add(customer.id, purchaseFormData);
        if(addActivityResult) {
            setSelectedCategory(null);
            setSelectedActivity(null);
            onClose();
        }
    }

    const handleFormInput = (name, value) => {
        setPurchaseFormData({ ...purchaseFormData, [name]: value }); 
    };

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
                const activityMenuData = await activityService.getActivityMenu();
                let categories = activityMenuData.map(item => item.category);
                // getActivityMenu() gets all sub categories (e.g. lunch, dinner), so a category (e.g. meal) can occur multiple times
                categories = Array.from(new Set(categories));
                
                setCategories(categories);
                setActivityMenuItems(activityMenuData);
                setLoadingMenu(false);
            } catch (err) {
                console.error("Failed to fetch menu:", err);
                setMenuError(err);
                setLoadingMenu(false);
            }     
        }   

        load();
    }, [customer?.id]); // Dependency array: re-run this effect if the customer's ID changes

    // Initialize purchaseFormData.customerPrice when selectedActivity changes
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
                    customerPrice: selectedActivity.customerPrice || '', // Set initial price from selected activity, or empty string
                }));
            }
        }
        load();

    }, [selectedActivity]);

    const handlePurchaseFormChange = (e) => {
        const { name, value } = e.target;

        // Special handling for price to ensure it's a number
        // Special handling for price: Convert to number after removing non-digit characters
        if (name === 'customerPrice') {
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
        // using selectedActivity.category, selectedActivity.subcategory, selectedActivity.customerPrice,
        // and purchaseFormData.date, purchaseFormData.time, purchaseFormData.comments
        console.log("Purchase Details:", {
            customer: customer.name,
            activity: selectedActivity.name,
            customerPrice: purchaseFormData.customerPrice,
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
                    <h3>Items in {selectedCategory}:</h3>

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
                   
                </div>
                
                <MyDatePicker name={"startingAt"} value={purchaseFormData.startingAt} onChange={handleFormInput}/>

                {/* Confirm meal selection before submitting to database */}
                {showConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h2>Confirm Your Order</h2>
                                {/* Display total order thus far */}
                                {selectedDishes ? (<>
                                    <p>You selected:</p>
                                    {Object.entries(selectedDishes).filter(([_, dishData]) => dishData.quantity > 0).map(([dishName, dishData]) => (
                                        <div key={`${dishName}-selected-wrapper`}>
                                            <p>{dishData.quantity}x {dishName} 
                                                {dishData.comments && (<i> ({dishData.comments.trim()})</i>)}
                                            </p>
                                       
                                        </div>
                                    ))}
                                </>) : null}
                            <p>Are you sure you want to submit this order?</p>
                            <div class="buttons-footer">
                                <button onClick={handleCancelConfirm}>Cancel</button>
                                <button onClick={onConfirmMeal}>Confirm</button>    
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="buttons-footer">
                    <button type="button" onClick={() => setSelectedActivity(null)} className="cancel-button">
                        Back to activities
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={ () => onSubmitMeal() }
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
                        <span className="ml-2">Add Purchase: {selectedActivity.displayName}</span>
                    </h2>
                </div>
                <div className="card-content">
                    <h3>Confirm Purchase Details:</h3>
                    <form onSubmit={handlePurchaseSubmit}>
                        <div className="purchase-form-group">
                            <label htmlFor="purchasePrice">Price:</label>
                            <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                                <span className="currency-prefix">Rp</span>
                                <input
                                    type="text" // Changed from "number" to "text"
                                    id="purchasePrice"
                                    name="customerPrice"
                                    // Apply formatting here for display inside the input
                                    value={utils.formatDisplayPrice(purchaseFormData.customerPrice)}
                                    onChange={handlePurchaseFormChange}
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <MyDatePicker name={"startingAt"} value={purchaseFormData.startingAt} onChange={handleFormInput} required/>
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
                            <button 
                                type="button"
                                onClick={() => handleActivityPurchase()}
                            >
                            Add Purchase
                            </button>
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
        const filteredItems = activityMenuItems.filter(item => item.category === selectedCategory);

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
                                        {item.displayName} <br></br> 
                                        { item.customerPrice !== 0 && (<>Rp {utils.formatDisplayPrice(purchaseFormData.customerPrice)}</>)}
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