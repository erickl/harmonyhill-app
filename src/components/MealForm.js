import React, { useState, useEffect } from 'react';
import "./MealForm.css";
import MyDatePicker from "./MyDatePicker.js";
import * as menuService from '../services/menuService.js';
import * as userService from '../services/userService.js';
import * as mealService from "../services/mealService.js";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import MealFormDish from "./MealFormDish.js";
import Dropdown from './Dropdown.js';
import { Checkbox, FormControlLabel } from '@mui/material';

export default function MealForm({selectedActivity, formData, handleFormDataChange }) {

    let meal = selectedActivity.subCategory;
    if(meal.includes("floating-breakfast")) meal = "breakfast";
    
    const [teamMembers,     setTeamMembers    ] = useState([]  );
    const [allDishes,       setAllDishes      ] = useState([]  );
    const [extraDishes,     setExtraDishes    ] = useState([]  ); // For breakfast, present extra options for extra charge
    const [expandedCourses, setExpandedCourses] = useState({}  );
    const [loadingMenu,     setLoadingMenu    ] = useState(true); // to indicate when data is being fetched
            
    const { onError } = useNotification();

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        handleFormDataChange("assignedTo", name);
    }

    const onGuestConfirmed = (checked) => {
        if(checked) {
            if(formData.status === "pending guest confirmation") {
                handleFormDataChange("status", "guest confirmed");
            }
        } else {
            // If status is further along, e.g. "started" or "completed", no sense in letting it go back to "pending"
            if(formData.status === "guest confirmed") {
                handleFormDataChange("status", "pending guest confirmation");
            }
        }   
    }

    const handleAddCustomDish = (() => {
        formData.dishes = utils.isEmpty(formData.dishes) ? [] : formData.dishes;
        const customDishes = formData.dishes.filter(dish => dish.custom === true);
        const newCustomDish = mealService.getNewCustomDish(customDishes.length + 1, "");
        formData.dishes.push(newCustomDish);
        handleFormDataChange("dishes", formData.dishes);
    });

    const handleExpandCourseSection = (course) => {
        const newExpandedCourses = { ...(expandedCourses || {}) };
        if(!utils.exists(newExpandedCourses, course)) {
            newExpandedCourses[course] = false;
        }
        newExpandedCourses[course] = !newExpandedCourses[course];
        setExpandedCourses(newExpandedCourses);
    }

    useEffect(() => {
        const load = async () => {
            if(selectedActivity) {
                const allDishes = await menuService.groupByCourse({
                    "meal"  : meal,
                    "house" : formData.house,
                });
                setAllDishes(allDishes);

                if(meal === "breakfast") {
                    const extraDishes = await menuService.get({
                        "meal"  : "extra",
                        "house" : formData.house,
                    });
                    extraDishes.map((extraDish) => {
                        extraDish.course = `extra`;
                        extraDish.priority = 700;
                    })
                    setExtraDishes(extraDishes);
                }      
            }

            setLoadingMenu(false);

            const teamMembers = await userService.getUsers();
            const formattedTeamMembers = teamMembers.reduce((m, teamMember) => {
                m[teamMember.name] = teamMember;
                return m;
            }, {})
            setTeamMembers(formattedTeamMembers);
        }
        load();
        
    }, [selectedActivity]);

    if (loadingMenu) {
        return (<div><p>Loading menu items...</p></div>);
    }

    // Sort appearance of meals by meal categories, i.e. first starters, then mains, lastly coffee, etc..
    const sortedMealNames = Object.keys(allDishes).sort((a, b) => a.localeCompare(b));

    formData.dishes = utils.isEmpty(formData.dishes) ? [] : formData.dishes;
    const customDishes = formData.dishes.filter(dish => dish.custom === true);

    const statuses = {
        "pending guest confirmation" : {"name" : "Pending Guest Confirmation"},
        "guest confirmed" : {"name" : "Guest Confirmed"},
    };

    return (
        <div>
            {selectedActivity.description && (
                <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>Description</h4>
                    <p style={{ marginTop: '0' }}>{selectedActivity.description}</p>
                </div>
            )}

            {selectedActivity.instructions && (
                <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>Instructions</h4>
                    <p style={{ marginTop: '0' }}>{selectedActivity.instructions}</p>
                </div>
            )}
            
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
                                        isFree={meal === "breakfast" || meal === "afternoon-tea"}
                                    />
                                ))}
                            </>)}
                        </div>
                    ))}
                    {extraDishes.length > 0 && (
                        <div key={`extra-dishes-wrapper`}>
                            <div className="course-header" onClick={() => handleExpandCourseSection("extra")}>
                                <h3>{expandedCourses["extra"] ? ' ▼' : ' ▶'}</h3>
                                <h2>Extra</h2>
                            </div>
                            
                            {/* Each dish has a counter, incrementor, a comment field, and other options */}
                            {expandedCourses["extra"] && (<>
                                {extraDishes.map((dish) => {
                                    return (
                                        <MealFormDish 
                                            dish={dish}
                                            formData={formData}
                                            handleFormDataChange={handleFormDataChange}
                                            isFree={false}
                                        />
                                    )
                                })}
                            </>)}
                        </div>
                    )}
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
                        {customDishes.map((dish) => (<>
                            <MealFormDish 
                                dish={dish}
                                formData={formData}
                                handleFormDataChange={handleFormDataChange}
                                custom={true}
                            />
                        </>))}
                    </div>
                )}

                <button onClick={() => {
                    handleAddCustomDish();
                }}>
                    Add custom dish
                </button>
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

            <div className="purchase-form-group">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={formData["status"] === "guest confirmed"}
                            onChange={(e) => {
                                onGuestConfirmed(e.target.checked);               
                            }}
                        />
                    }
                    label="Guest confirmed?"
                />
            </div>

            <div className="purchase-form-group">
                <MyDatePicker 
                    name={"startingAt"} 
                    date={formData.startingAt}
                    time={formData.startingTime}
                    onChange={handleFormDataChange}
                />
            </div>

            <div className="purchase-form-group">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={formData["isFree"] ? formData["isFree"] : false}
                            onChange={(e) => handleFormDataChange("isFree", e.target.checked)}
                        />
                    }
                    label="Check box if the entire meals is free"
                />
            </div>
        </div>
    );
}
