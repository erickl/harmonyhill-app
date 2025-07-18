import React, { useState, useEffect } from 'react';
import "./MealForm.css";
import MyDatePicker from "./MyDatePicker.js";
import * as menuService from '../services/menuService.js';
import * as utils from "../utils.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import MealFormDish from "./MealFormDish.js";

export default function MealForm({selectedActivity, formData, handleFormDataChange }) {
    
    const [allDishes, setAllDishes] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    
    const [errorMessage, setErrorMessage] = useState(null);
            
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

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

    const customDish = {
        "id" : "custom-dish-id-1",
        "name" : "Custom: ",
    };

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
                                <MealFormDish 
                                    dish={dish}
                                    formData={formData}
                                    handleFormDataChange={handleFormDataChange}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <p>No dishes found</p>
            )}

            {/* Custom Items */}
            <MealFormDish 
                dish={customDish}
                formData={formData}
                handleFormDataChange={handleFormDataChange}
                editable={true}
            />

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
