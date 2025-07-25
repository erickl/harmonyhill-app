import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import ActivityComponent from './ActivityComponent';
import "./ActivityComponent.css";
import {getParent} from "../daos/dao.js";

const ActivitiesList = ({customer, activities, handleEditActivity}) => {
    const [expanded, setExpanded] = useState({});
    const [selectedActivity, setSelectedActivity] = useState(null);

    const handleSetExpanded = (date) => {
        const updatedExpandedList = { ...(expanded || {}) }; // Make shallow copy
        updatedExpandedList[date] = updatedExpandedList[date] === true ? false : true;
        setExpanded(updatedExpandedList);
    };

    const handleActivityClick = async (activity) => {
        // If clicking on the same activity, depress it again
        if(selectedActivity?.id === activity?.id) {
            setSelectedActivity(null);
        } else {   
            refreshSelectedActivity(activity);
        }
    };

    const refreshSelectedActivity = async (activity) => {
        if(!activity) {
            return;
        }
        if(activity.category === "meal") {
            // If this list is displayed for all customers, get the customer for each activity 
            const selectedCustomer = customer ? selectedCustomer : await getParent(activity);
            const dishes = await mealService.getDishes(selectedCustomer.id, activity?.id);
            let newActivity = { ...(activity || {}) }; // Make shallow copy
            newActivity.dishes = dishes;
            setSelectedActivity(newActivity);
        }
        else {
            setSelectedActivity(activity);
        }
    }

    useEffect(() => {
        // Open today's activities by default
        const today_ddMMM = utils.to_ddMMM(utils.today());
        handleSetExpanded(today_ddMMM);
    }, []);

    if(activities.length === 0) {
        return (<div><h2>No activities yet</h2></div>);
    }

    const activitiesByDate = activities.reduce((m, activity) => {
        const date = activity.startingAt_ddMMM ? activity.startingAt_ddMMM : "Date TBD";
        if(!m[date]) m[date] = [];
        m[date].push(activity);
        return m;
    }, {});

    return (<>
        {Object.entries(activitiesByDate).map(([date, activities]) => (
            <React.Fragment key={`activities-${date}`}>
                <div>
                    <h3
                        className={'customer-group-header clickable-header'}
                        onClick={() => handleSetExpanded(date) }>
                        
                        {date}
                        
                        <span className="expand-icon">
                            {expanded[date] ? ' ▼' : ' ▶'} {/* Added expand/collapse icon */}
                        </span>
                    </h3>
                    {expanded[date] ? (
                        <div>
                            {activities.map((activity) => (
                                <React.Fragment key={activity.id}>
                                    <div
                                        className={`customer-list-item clickable-item ${utils.getHouseColor(activity.house)}`} 
                                        onClick={() => handleActivityClick(activity)}
                                    >
                                        <div className="customer-name-in-list">
                                            <span>{`${utils.capitalizeWords(activity.category)}`}</span>
                                            <span>{activity.startingAt_HHmm}</span>
                                        </div>
                                        {utils.capitalizeWords(activity.subCategory)}
                                    </div>
                                    {selectedActivity?.id === activity.id && (      
                                        <ActivityComponent 
                                            activity={selectedActivity}
                                            handleEditActivity={handleEditActivity}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        null
                    )}
                </div>
            </React.Fragment>
        ))}
    </>);
}

export default ActivitiesList;
