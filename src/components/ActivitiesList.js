import React, { useState, useEffect, useRef } from 'react';
import * as utils from "../utils.js";
import ActivityComponent from './ActivityComponent.js';
import EditPurchaseScreen from './EditPurchaseScreen.js';
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import "./ActivityComponent.css";
import "./ActivitiesList.css";
import { useNotification } from "../context/NotificationContext.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import {getParent} from "../daos/dao.js";

export default function ActivitiesList({onNavigate, onClose, from, to, customer, expandAllDates}) {
    const [expandedDates,           setExpandedDates    ] = useState({}   ); 
    const [activitiesByDate,        setActivitiesByDate ] = useState({}   );
    const [loading,                 setLoading          ] = useState(true );

    const todaysHeader = useRef(null);

    const getCustomer = async(activity) => {
        return customer ? customer : await getParent(activity);
    };

    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();

    const handleDeleteActivity = async (activity) => {
        onConfirm(`Are you sure you want to delete this ${activity.displayName}?`, async () => {
            if(!activity || utils.isEmpty(activity.id)) return;
        
            const activityCustomer = await getCustomer(activity);
            if(!activityCustomer || utils.isEmpty(activityCustomer.id)) {
                onError(`Can't find customer for activity ${activity.id}`);
            }

            let deleteActivityResult = false;
            if(activity.category === "meal") {
                deleteActivityResult = mealService.removeMeal(activity, onError);
            } else {
                deleteActivityResult = await activityService.remove(activity, onError);
            }
            
            // Delete activity from the current GUI list
            if(deleteActivityResult !== false) {
                const newActivitiesByDate = utils.deepCopy(activitiesByDate);
                const activitiesOnDate = newActivitiesByDate[activity.startingAt_ddMMM];
                newActivitiesByDate[activity.startingAt_ddMMM] = activitiesOnDate.filter((act) => act.id !== activity.id);
                setActivitiesByDate(newActivitiesByDate);
            } 
        });
    };

    const handleSetExpandedDates = (date) => {
        let updatedExpandedList = { ...(expandedDates || {}) }; 
        updatedExpandedList[date] = updatedExpandedList[date] === true ? false : true;
        setExpandedDates(updatedExpandedList);
    };

    // newActivity might be an update to an existing activity or an entirely new activity (e.g minibar sale)
    const onActivityChange = (newActivity) => {
        if(!newActivity) return onError(`Unexpected error: Cannot add new activity to current list`);
        const changedActivitiesByDate = utils.deepCopy(activitiesByDate);
        
        const date = newActivity.startingAt_ddMMM;
        if(!date) return onError(`Unexpected error: New activity is missing DD MMM date`);

        const index = changedActivitiesByDate[newActivity.startingAt_ddMMM].findIndex((activity) => activity.id === newActivity.id);
        if(index === -1) {
            changedActivitiesByDate[date].push(newActivity);
        } else {
            changedActivitiesByDate[date][index] = newActivity;
        }
        
        setActivitiesByDate(changedActivitiesByDate);
        return true;
    };

    const today_ddMMM = utils.to_ddMMM(utils.today(0, false));

    useEffect(() => {
        if (todaysHeader.current) {
            todaysHeader.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [activitiesByDate]); // runs whenever activities change

    useEffect(() => {
        const getActivities = async() => {
            setLoading(true);

            let activities = [];

            if(customer) {
                activities = await activityService.get(customer.id);
            } else {    
                const filter = {"after" : from, "before" : to};
                activities = await activityService.getAll(filter);
            }

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

            setLoading(false);
        }

        getActivities();
    }, [customer]);

    if(Object.keys(activitiesByDate).length === 0) {
        return (<div><h2>No activities</h2></div>);
    }

    return (
        <div className="card-content">
            {loading ? (
                <p>Loading...</p>
            ) : (<>
            {Object.entries(activitiesByDate).map(([date, activities]) => {
                const isTodaysHeader = date === today_ddMMM;
                return (
                    <React.Fragment key={`activities-${date}`}>
                        <div>
                            <h3
                                className={'customer-group-header clickable-header'}
                                onClick={() => handleSetExpandedDates(date) }
                                ref={isTodaysHeader ? todaysHeader : null}
                            >
                                {`${date}${(isTodaysHeader ? ` | ${utils.to_HHmm()}` : "")}`}
                                
                                <span className="expand-icon">
                                    {expandedDates[date] ? ' ▼' : ' ▶'}
                                </span>
                            </h3>
                            {expandedDates[date] ? (
                                <div>
                                    {activities.map((activity, index) => {
                                        return (
                                            <React.Fragment key={activity.id}>   
                                                <ActivityComponent 
                                                    inputCustomer={customer}
                                                    activity={activity}
                                                    onActivityChange={(newActivity) => onActivityChange(newActivity)}
                                                    onNavigate={onNavigate}
                                                    onClose={onClose}
                                                    handleDeleteActivity={() => handleDeleteActivity(activity)}
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
                );
            })}
            </>)}
        </div>
    );
};
