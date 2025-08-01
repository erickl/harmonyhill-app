import React, { useState, useEffect } from 'react';
import "./MealForm.css";
import MyDatePicker from "./MyDatePicker.js";
import * as menuService from '../services/menuService.js';
import * as userService from '../services/userService.js';
import * as mealService from "../services/mealService.js";
import * as utils from "../utils.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';
import MealFormDish from "./MealFormDish.js";
import Dropdown from './Dropdown.js';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';

export default function MealForm({selectedActivity, formData, handleFormDataChange }) {
    
    const [teamMembers, setTeamMembers] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [loadingMenu, setLoadingMenu] = useState(true); // to indicate when data is being fetched
    
    const [errorMessage, setErrorMessage] = useState(null);
            
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        handleFormDataChange("assignedTo", name);
    }

    const handleExpandCourseSection = (course) => {
        const newExpandedCourses = { ...(expandedCourses || {}) };
        if(!Object.hasOwn(newExpandedCourses, course)) {
            newExpandedCourses[course] = false;
        }
        newExpandedCourses[course] = !newExpandedCourses[course];
        setExpandedCourses(newExpandedCourses);
    }

    useEffect(() => {
        const load = async () => {
            const allDishes = selectedActivity ? await menuService.groupByCourse({
                "meal"  : selectedActivity.subCategory,
                "house" : formData.house,
            }) : [];
            setAllDishes(allDishes);
            setLoadingMenu(false);

            const teamMembers = await userService.getUsers();
            const formattedTeamMembers = teamMembers.reduce((m, teamMember) => {
                m[teamMember.name] = teamMember;
                return m;
            }, {})
            setTeamMembers(formattedTeamMembers);
        }
        load();
        
        // todo: inelegant exception, saying that breakfast is included always at Harmony Hill
        handleFormDataChange("isFree", selectedActivity.subCategory === "breakfast");
    }, [selectedActivity]);

    if (loadingMenu) {
        return (<div><p>Loading menu items...</p></div>);
    }

    // Sort appearance of meals by meal categories, i.e. first starters, then mains, lastly coffee, etc..
    const sortedMealNames = Object.keys(allDishes).sort((a, b) => a.localeCompare(b));

    const customDishes = Object.values(formData.dishes).filter(dish => dish.custom === true);
    const newCustomDish = mealService.getNewCustomDish(customDishes.length + 1, "");

    return (
        <div>
            <h3>{selectedActivity.instructions}</h3>
            {/* Display all dishes, inc/dec buttons, and how many of each dish */}
            {Object.entries(allDishes).length > 0 ? (
                <div className="activity-button-container">

                    {/* Dishes grouped by meals (Starters, main, desserts, etc...) */}
                    {sortedMealNames.map((course) => (
                        <div key={`${course}-wrapper`}>
                            <div className="course-header" onClick={() => handleExpandCourseSection(course)}>
                                <h3>{expandedCourses[course] ? ' ▼' : ' ▶'}</h3>
                                <h2>{utils.capitalizeWords(course.split(",")[1])}</h2>
                            </div>
                            
                            {/* Each dish has a counter, incrementor, a comment field, and other options */}
                            {expandedCourses[course] && (<>
                                {allDishes[course].map((dish) => (
                                    <MealFormDish 
                                        dish={dish}
                                        formData={formData}
                                        handleFormDataChange={handleFormDataChange}
                                    />
                                ))}
                            </>)}
                        </div>
                    ))}
                </div>
            ) : (
                <p>No dishes found</p>
            )}

            <div className="course-header" onClick={() => handleExpandCourseSection("custom")}>
                <h3>{expandedCourses["custom"] ? ' ▼' : ' ▶'}</h3>
                <h2>Custom</h2>
            </div>

            {/* List existing custom dishes */}
            {expandedCourses["custom"] && (<>
                {!utils.isEmpty(customDishes) && (
                    <div key="custom-wrapper">   
                        {customDishes.map((dish) => (
                            <MealFormDish 
                                dish={dish}
                                formData={formData}
                                handleFormDataChange={handleFormDataChange}
                                custom={true}
                            />
                        ))}
                    </div>
                )}

                {/* A field for a new custom dish */}
                <MealFormDish 
                    dish={newCustomDish}
                    formData={formData}
                    handleFormDataChange={handleFormDataChange}
                    custom={true}
                />
            </>)}

            <div className="">
                <label htmlFor="mealComments">Comments:</label>
                <textarea
                    id="mealComments"
                    name="comments"
                    value={formData.comments}
                    onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                    rows="2"
                    className="input"
                ></textarea>
            </div>

            <div className="purchase-form-group">
                <Dropdown 
                    current={formData.assignedTo} 
                    label={"Assign to team member"} 
                    options={teamMembers} 
                    onSelect={onTeamMemberSelect}
                />
            </div>

            <MyDatePicker 
                name={"startingAt"} 
                date={formData.startingAt}
                time={formData.startingTime}
                onChange={handleFormDataChange}
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={formData["isFree"] ? formData["isFree"] : false}
                        onChange={(e) => handleFormDataChange("isFree", e.target.checked)}
                    />
                }
                label="Free"
            />

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
}
