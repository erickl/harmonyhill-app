
import React, { useState, useEffect, use } from 'react';
import * as mealService from "../services/mealService.js"; 
import * as activityService from "../services/activityService.js"; 
import * as menuService from "../services/menuService.js"; 
import ActivityForm from "./ActivityForm.js";
import MealForm from "./MealForm.js";
import ConfirmOrderModal from './ConfirmOrderModal.js';
import ButtonsFooter from './ButtonsFooter.js';
import "./EditPurchaseScreen.css";
import "../App.css";
import ErrorNoticeModal from './ErrorNoticeModal.js';

const EditPurchaseScreen = ({ customer, activityToEdit, onClose, onNavigate }) => {

    // Show purchase summary and confirmation pop up modal
    const [showConfirm, setShowConfirm] = useState(false);
    const [activityMenuItem, setActivityMenuItem] = useState(null);

    const [errorMessage, setErrorMessage] = useState(null);

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const [formData, setFormData] = useState({
        startingAt    : activityToEdit.startingAt,
        category      : activityToEdit.category,
        subCategory   : activityToEdit.subCategory,
        comments      : activityToEdit.comments,
        customerPrice : activityToEdit.customerPrice, // not editable for meals. Derived from the dishes' costs 
        provider      : activityToEdit.provider,
        assignedTo    : activityToEdit.assignedTo,
        status        : activityToEdit.status, // not editable. Edits automatically when provider is assigned  
        dishes        : activityToEdit.dishes, // not null only for meal activities 
    });

    const handlePurchaseFormChange = (name, value) => {
        // Special handling for price to ensure it's a number
        // Special handling for price: Convert to number after removing non-digit characters
        if (name === 'customerPrice') {
            // Remove all non-digit characters (commas, dots, currency symbols, etc.)
            const cleanValue = value.replace(/[^0-9]/g, '');
            // Convert to integer; use empty string if input is empty
            const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
            setFormData(prevData => ({ ...prevData, [name]: numericValue }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const onSubmit = async () => {
        setShowConfirm(true);
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
    };

    const handleEditPurchaseSubmit = async() => {
        try {
            let editActivitySuccess = null;
            if(activityToEdit.category === "meal") {
                editActivitySuccess = await mealService.update(customer.id, activityToEdit.id, formData, onError);
            } else {
                editActivitySuccess = await activityService.update(customer.id, activityToEdit.id, formData, onError);
            }
            
            if(editActivitySuccess) {
                onClose();
            }
        } catch(error) {
            onError(`Unexpected error while trying to update meal: ${error.message}`);
        }
    };

    useEffect(() => {
        const fetchActivityMenuItemData = async () => {
            const menuItem = await activityService.getActivityMenuItem(activityToEdit.category, activityToEdit.subCategory);
            setActivityMenuItem(menuItem);
        };

        fetchActivityMenuItemData();
    }, []);

    // --- Render activityToEdit form or meal selection
    if (!activityToEdit) {
        return (<div>
            <p>Database error: Cannot find activityToEdit</p>
        </div>)
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <span className="ml-2">Edit Purchase: {activityToEdit.displayName}</span>
                </h2>
            </div>
            <div className="card-content">
                {/* Display meal purchase form */}
                {activityToEdit.category === "meal" ? (
                    <MealForm 
                        selectedActivity={activityMenuItem}
                        formData={formData}
                        handleFormDataChange={handlePurchaseFormChange}
                    />
                // Display form for all other activities
                ) : ( 
                    <ActivityForm 
                        selectedActivity={activityMenuItem}
                        formData={formData} 
                        handleFormDataChange={handlePurchaseFormChange}  
                    />
                )}
            </div>

            {/* Confirm meal selection before submitting to database */}
            {showConfirm && (
                <ConfirmOrderModal 
                    selected={formData.dishes}
                    onCancel={handleCancelConfirm}
                    onConfirm={handleEditPurchaseSubmit}
                />
            )}

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
            
            <ButtonsFooter 
                onCancel={onClose} 
                onSubmit={onSubmit}
            />
        </div>
    )
    
};

export default EditPurchaseScreen;
