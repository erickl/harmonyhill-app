
import React, { useState, useEffect, use } from 'react';
import * as mealService from "../services/mealService.js"; 
import * as activityService from "../services/activityService.js"; 
import * as menuService from "../services/menuService.js"; 
import * as utils from "../utils.js";
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
    const [readyToSubmit, setReadyToSubmit] = useState(false);

    const [errorMessage, setErrorMessage] = useState(null);

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const [formData, setFormData] = useState({
        startingAt    : activityToEdit.startingAt,
        startingTime  : activityToEdit.startingTime,
        category      : activityToEdit.category,
        subCategory   : activityToEdit.subCategory,
        comments      : activityToEdit.comments,
        customerPrice : activityToEdit.customerPrice, // not editable for meals. Derived from the dishes' costs 
        provider      : activityToEdit.provider,
        assignedTo    : activityToEdit.assignedTo,
        status        : activityToEdit.status, // not editable. Edits automatically when provider is assigned  
        dishes        : activityToEdit.dishes, // not null only for meal activities 
        
        // Auxiliary data
        house         : customer.house,
        guestCount    : customer.guestCount,
    });

    const handleFormDataChange = (name, value, type) => {
        let nextFormData = {};

        if (name === "_batch" && typeof value === 'object' && value !== null) {
            nextFormData = ({ ...formData, ...value });
        }

        // Special handling for price to ensure it's a number
        // Special handling for price: Convert to number after removing non-digit characters
        else if (type === 'amount') {
            nextFormData = { ...formData, [name]: utils.cleanNumeric(value) };
        } else {
            nextFormData = { ...formData, [name]: value };  
        }

        if(!utils.isEmpty(nextFormData)) {
            setFormData(nextFormData);
        }
        
        if(activityToEdit) {
            let validationResult = false;
            if(activityToEdit.category === "meal") {
                validationResult = mealService.validate(nextFormData, true);
            } else {
                validationResult = activityService.validate(nextFormData, true);
            }
            setReadyToSubmit(validationResult);
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
            const menuItem = await activityService.getActivityMenuItem(activityToEdit.category, activityToEdit.subCategory, customer.house);
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
                        handleFormDataChange={handleFormDataChange}
                    />
                // Display form for all other activities
                ) : ( 
                    <ActivityForm 
                        selectedActivity={activityMenuItem}
                        formData={formData} 
                        handleFormDataChange={handleFormDataChange}  
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
                submitEnabled={readyToSubmit}
            />
        </div>
    )
    
};

export default EditPurchaseScreen;
