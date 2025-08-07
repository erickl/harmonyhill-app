import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import ActivityComponent from './ActivityComponent';
import "./ActivityComponent.css";
import {getParent} from "../daos/dao.js";
import WarningSymbol from './WarningSymbol.js';


const ActivitiesList = ({customer, activities, handleEditActivity, expandAllDates}) => {
    const [expanded, setExpanded] = useState({});
    const [selectedActivities, setSelectedActivities] = useState({});
    const [activitiesByDate, setActivitiesByDate] = useState({});

    const handleSetExpanded = (date) => {
        let updatedExpandedList = { ...(expanded || {}) }; // Make shallow copy
        updatedExpandedList[date] = updatedExpandedList[date] === true ? false : true;
        setExpanded(updatedExpandedList);
    };

    const handleActivityClick = async (activity) => {
        if(!activity) return;

        const id = activity.id;

        let updatedList = { ...(selectedActivities || {}) };
        
        const expandActivityInfo = updatedList[id] === null || updatedList[id] === undefined;

        if(expandActivityInfo) {
             if(activity.category === "meal") {
                // If this list is displayed for all customers, get the customer for each activity 
                const selectedCustomer = customer ? customer : await getParent(activity);      
                activity.dishes = await mealService.getDishes(selectedCustomer.id, activity.id);  ;
            }
        }

        updatedList[id] = expandActivityInfo ? activity : null;

        setSelectedActivities(updatedList);
    };

    const today_ddMMM = utils.to_ddMMM(utils.today());

    useEffect(() => {
        const allActivitiesByDate = activities.reduce((m, activity) => {
            const date = activity.startingAt_ddMMM ? activity.startingAt_ddMMM : "Date TBD";
            if(!m[date]) m[date] = [];
            m[date].push(activity);
            return m;
        }, {});

        setActivitiesByDate(allActivitiesByDate)

        const today = utils.today();

        // If not all dates are expanded, expand today's activities by default, 
        if(expandAllDates === true) {
            const dates = Object.keys(allActivitiesByDate);
            let expandedList = {};
            for(const date of dates) {
                const activitiesForDate = allActivitiesByDate[date];
                const activity = !utils.isEmpty(activitiesForDate) ? activitiesForDate[0] : null;
                const startingAt = activity ? activity.startingAt : null;
                expandedList[date] = startingAt && startingAt >= today;
            } 
            setExpanded(expandedList);
        } else {
            handleSetExpanded(today_ddMMM);
        }
    }, [activities, customer]);

    if(activitiesByDate.length === 0) {
        return (<div><h2>No activities yet</h2></div>);
    }

    return (<>
        {Object.entries(activitiesByDate).map(([date, activities]) => (
            <React.Fragment key={`activities-${date}`}>
                <div>
                    <h3
                        className={'customer-group-header clickable-header'}
                        onClick={() => handleSetExpanded(date) }>
                        
                        {`${date}${(date === today_ddMMM ? " (Today)" : "")}`}
                        
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
                                            

                                            {(!utils.isString(activity.status) && activity.status.toLowerCase() !== "confirmed" && <WarningSymbol />)}
                                            <span>{activity.startingAt_HHmm}</span>
                                        </div>  
                                        
                                        {utils.capitalizeWords(activity.subCategory)}
                                        
                                    </div>
                                    {selectedActivities[activity.id] && (  
                                        // if global customer unspecified, this is the list for all customers, so each activity should have some customer data
                                        <ActivityComponent 
                                            displayCustomer={customer === null}
                                            activity={selectedActivities[activity.id]}
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
