import React, { useState, useEffect } from 'react';
// import { Pencil } from 'lucide-react';
import * as activityService from '../services/activityService.js'; // Import the booking service
import * as utils from '../utils.js';

const AddPurchaseScreen = ({ customer, onClose, onNavigate }) => {

    // State to hold the categories
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    // State to track the currently selected category
    const [selectedCategory, setSelectedCategory] = useState(null);

    // State to hold the menu items (activities)
    const [menuItems, setMenuItems] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    const [menuError, setMenuError] = useState(null); // to handle errors with loading the menu

    // State to track the currently selected activity (for the purchase form)
    const [selectedActivity, setSelectedActivity] = useState(null);

    // State for the purchase form data
    const [purchaseFormData, setPurchaseFormData] = useState({
        date: '',
        time: '',
        comments: '',
        price: '',
    });



    // useEffect to fetch categories when the component mounts or customer ID changes
    useEffect(() => {
        const fetchCategories = async () => {
            // Only fetch if a customer is provided, as we will add purchase to a specific customer
            if (!customer) {
                setLoadingCategories(false);
                return;
            }
            setLoadingCategories(true);
            setCategoriesError(null);
            try {
                const categoryData = await activityService.getCategories();
                console.log('Fetched category data (raw):', categoryData); // Debugging: Log what's returned

                // Check if it's a Set and convert to array, or if it's already an array (can remove when data structure stable)
                if (categoryData instanceof Set) {
                    const categoriesArray = Array.from(categoryData);
                    console.log('Converted Set to Array:', categoriesArray);
                    setCategories(categoriesArray);
                } else if (Array.isArray(categoryData)) {
                    setCategories(categoryData);
                } else {
                    console.error("activityService.getCategories() did not return an array or a Set:", categoryData);
                    setCategoriesError(new Error("Categories data is not in the expected array or Set format."));
                }
                setLoadingCategories(false);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                setCategoriesError(err);
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [customer?.id]); //

    // useEffect to fetch the menu items when the component mounts or customerID changes (ensuring updates come through without restarting the app)
    useEffect(() => {
        const fetchMenu = async () => {
            // Only fetch if a customer is provided, as the screen is for adding purchases for a customer
            if (!customer) {
                setLoadingMenu(false);
                return;
            }
            setLoadingMenu(true); // Set loading to true before fetching
            setMenuError(null); // Clear previous errors

            try {
                // Call the service function to get the menu
                const menuData = await activityService.getMenu();
                setMenuItems(menuData); // Store the fetched data in state
                setLoadingMenu(false);
            } catch (err) {
                console.error("Failed to fetch menu:", err);
                setMenuError(err);
                setLoadingMenu(false);
            }
        };

        fetchMenu();
    }, [customer?.id]); // Dependency array: re-run this effect if the customer's ID changes

    // NEW useEffect: Initialize purchaseFormData.price when selectedActivity changes
    useEffect(() => {
        if (selectedActivity) {
            setPurchaseFormData(prevData => ({
                ...prevData,
                price: selectedActivity.price || '', // Set initial price from selected activity, or empty string
            }));
        }
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


    if (loadingCategories || loadingMenu) {
        return (
            <div className="card">
                <div className="card-content">
                    <p>Loading menu items...</p>
                </div>
            </div>
        );
    }

    if (categoriesError || menuError) {
        return (
            <div className="card">
                <div className="card-content">
                    <p>Error loading menu: {menuError.message}</p>
                </div>
            </div>
        );
    }


    // --- Render Purchase Form ---
    if (selectedActivity) {
        console.log('Rendering: Purchase Form');
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
                                            console.log('Activity button clicked. Setting selectedActivity to:', item);
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