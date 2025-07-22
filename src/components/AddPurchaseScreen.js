import React, { useState, useEffect } from 'react';
import * as activityService from '../services/activityService.js'; 
import * as mealService from '../services/mealService.js';
import * as utils from '../utils.js';
import "./AddPurchaseScreen.css";
import ActivityForm from "./ActivityForm.js";
import MealForm from "./MealForm.js";
import ConfirmOrderModal from './ConfirmOrderModal.js';
import ButtonsFooter from './ButtonsFooter.js';
import ErrorNoticeModal from './ErrorNoticeModal.js';

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
    
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched

    const initialForm = {
        startingAt    : null, // important for Luxon Date time to reset to null, not empty string
        comments      : '',
        customerPrice : '',
        provider      : '',
        assignedTo    : '',
        dishes        : {}, // only not null when ordering meals, null for all other activities
    };

    const [errorMessage, setErrorMessage] = useState(null);
    
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    // State for the purchase form data
    const [purchaseFormData, setPurchaseFormData] = useState(initialForm);

    const handleCategorySelection = async (category) => {
        setSelectedCategory(category);
        if(category == null) {
            setSelectedCategory(null);
            setPurchaseFormData(initialForm);
            return;
        }
    }

    const handleActivitySelection = async (activity) => {
        setSelectedActivity(activity);
        if(activity == null) {
            setSelectedCategory(null);
            setPurchaseFormData(initialForm);
            return;
        }

        if(selectedCategory == null) {
            console.log(`Error: subCategory ${activity.subCategory} selected without a category`);
        }

        handleFormDataChange("customerPrice", activity.customerPrice);
    }

    const handleActivityPurchase = async () => {
        let addActivityResult = null;

        purchaseFormData.category = selectedCategory;
        purchaseFormData.subCategory = selectedActivity.subCategory;

        if(selectedActivity.category === "meal") {
            // todo: do some checks: check if there is already a dinner on this day. 
            // Check if the dinner is on a day which the customer is not staying there
            addActivityResult = await mealService.addMeal(customer.id, {
                "category"    : selectedCategory,
                "subCategory" : selectedActivity.subCategory,
                "dishes"      : purchaseFormData.dishes,
                "status"      : "requested",
                "startingAt"  : purchaseFormData.startingAt,
            }, 
            onError);
        } else {
            addActivityResult = await activityService.add(customer.id, purchaseFormData, onError);
        }
        
        if(addActivityResult) {
            handleCategorySelection(null);
            handleActivitySelection(null);
            onClose();
        }
    }

    const onSubmit = async () => {
        setShowConfirm(true);
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
    };

    const handleFormDataChange = (name, value) => {
        // Special handling for price to ensure it's a number
        // Special handling for price: Convert to number after removing non-digit characters
        if (name === 'customerPrice') {
            // Remove all non-digit characters (commas, dots, currency symbols, etc.)
            const cleanValue = utils.isString(value) ? value.replace(/[^0-9]/g, '') : value;
            // Convert to integer; use empty string if input is empty
            const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
            setPurchaseFormData(prevData => ({ ...prevData, [name]: numericValue }));
        } else {
            setPurchaseFormData({ ...purchaseFormData, [name]: value });
        }
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

            try {
                const activityMenuData = await activityService.getActivityMenu();
                let categories = activityMenuData.map(item => item.category);
                // getActivityMenu() gets all sub categories (e.g. lunch, dinner), so a category (e.g. meal) can occur multiple times
                categories = Array.from(new Set(categories));
                
                setCategories(categories);
                setActivityMenuItems(activityMenuData);
                setLoadingMenu(false);
            } catch (err) {
                onError(`Failed to fetch menu: ${err.message}`);
                setLoadingMenu(false);
            }     
        }   

        load();
    }, [customer?.id]); // Dependency array: re-run this effect if the customer's ID changes

    if (loadingMenu) {
        return (
            <div className="card">
                <div className="card-content">
                    <p>Loading menu items...</p>
                </div>
            </div>
        );
    }

    // --- Render activity form or meal selection
    if (selectedActivity) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <span className="ml-2">Add Purchase: {selectedActivity.displayName}</span>
                    </h2>
                </div>
                <div className="card-content">
                    {/* Display meal purchase form */}
                    {selectedActivity.category === "meal" ? (
                        <MealForm 
                            selectedActivity={selectedActivity}
                            formData={purchaseFormData}
                            handleFormDataChange={handleFormDataChange}
                        />
                    // Display form for all other activities
                    ) : ( 
                        <ActivityForm 
                            selectedActivity={selectedActivity}
                            formData={purchaseFormData} 
                            handleFormDataChange={handleFormDataChange}  
                            custom={selectedActivity.subCategory === "custom"}
                        />
                    )}
                </div>

                {/* Confirm meal selection before submitting to database */}
                {showConfirm && (
                    <ConfirmOrderModal 
                        selected={purchaseFormData.dishes}
                        onCancel={handleCancelConfirm}
                        onConfirm={handleActivityPurchase}
                    />
                )}

                {errorMessage && (
                    <ErrorNoticeModal 
                        error={errorMessage}
                        onClose={() => setErrorMessage(null) }
                    />
                )}
                
                <ButtonsFooter 
                    onCancel={handleActivitySelection} 
                    onSubmit={onSubmit}
                />
            </div>
        )
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
                                            handleActivitySelection(item)
                                        }}
                                    >
                                        {item.displayName} <br></br> 
                                        { item.customerPrice !== 0 && (<>{utils.formatDisplayPrice(item.customerPrice, true)}</>)}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No items found in this category.</p>
                    )}
                </div>
                <div>
                    <button type="button" onClick={() => handleCategorySelection(null)} className="cancel-button">
                        Back to categories
                    </button>
                </div>

                {errorMessage && (
                    <ErrorNoticeModal 
                        error={errorMessage}
                        onClose={() => setErrorMessage(null) }
                    />
                )}
            </div>
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
                            <div key={category}>
                                <button
                                    className="category-button"
                                    onClick={() => handleCategorySelection(category)}
                                >
                                    {utils.capitalizeWords(category)}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No categories available.</p>
                )}

            </div>
            <div>
                <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
            </div>
            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
};

export default AddPurchaseScreen;
