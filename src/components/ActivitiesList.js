import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import ActivityComponent from './ActivityComponent';
import "./ActivityComponent.css";


const ActivitiesList = ({customer, activities, handleEditActivity, handleDeleteActivity, expandAllDates}) => {
    const [expandedDates,           setExpandedDates          ] = useState({}); 
    const [activitiesByDate,        setActivitiesByDate       ] = useState({});
    const [users,                   setUsers                  ] = useState([]);

    const handleSetExpandedDates = (date) => {
        let updatedExpandedList = { ...(expandedDates || {}) }; // Make shallow copy
        updatedExpandedList[date] = updatedExpandedList[date] === true ? false : true;
        setExpandedDates(updatedExpandedList);
    };

    const today_ddMMM = utils.to_ddMMM(utils.today());

    useEffect(() => {
        const getUsers = async() => {
            const allUsers = await userService.getUsers();
            setUsers(allUsers);
        };

        getUsers();
        
    }, []);

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
            setExpandedDates(expandedList);
        } else {
            handleSetExpandedDates(today_ddMMM);
        }
    }, [activities, customer]);

    if(Object.keys(activitiesByDate).length === 0) {
        return (<div><h2>No activities yet</h2></div>);
    }

    return (<>
        {Object.entries(activitiesByDate).map(([date, activities]) => (
            <React.Fragment key={`activities-${date}`}>
                <div>
                    <h3
                        className={'customer-group-header clickable-header'}
                        onClick={() => handleSetExpandedDates(date) }>
                        
                        {`${date}${(date === today_ddMMM ? " (Today)" : "")}`}
                        
                        <span className="expand-icon">
                            {expandedDates[date] ? ' ▼' : ' ▶'} {/* Added expand/collapse icon */}
                        </span>
                    </h3>
                    {expandedDates[date] ? (
                        <div>
                            {activities.map((activity) => {
                                return (
                                    <React.Fragment key={activity.id}>   
                                        <ActivityComponent 
                                            showCustomer={customer == null}
                                            activity={activity}
                                            handleEditActivity={handleEditActivity}
                                            handleDeleteActivity={handleDeleteActivity}
                                            users={users}
                                        />
                                    </React.Fragment>
                                )
                            })}
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
