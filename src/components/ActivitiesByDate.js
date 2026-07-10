import React, { useState, useEffect, useRef } from 'react';
import ActivityComponent from './ActivityComponent.js';
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import { useNotification } from '../context/NotificationContext.js';
import * as utils from "../utils.js";
import Spinner from './Spinner.js';
import "./ActivitiesByDate.css";
import { update } from '../daos/userDao.js';

export default function ActivitiesByDate({ context, customer, date, date1, date2 }) {
    const today = utils.today();
    
    let from = date1 ? date1.startOf('day') : null;
    let to = date2 ? date2.endOf('day') : null;

    // input date(s) define 1 particular day, not a range of dates
    const singleDate = date || utils.dateIsSame(date1, date2, true); 

    // Giving no dates means to get all the unscheduled activities
    const noDates = !from && !to && !date;
    const isPast = date && utils.isPast(date.startOf('day'));
    const isToday = date && utils.isToday(date);
    const isThisWeek = date && (date > today && date < utils.today(7));
    
    // if all input dates === null, then filter => {date: null}, which means getting unscheduled activities
    const filter = (from && to) ? { after: from, before: to } : {date : date};
    
    let dateFormatted = "Unscheduled";
    if(from || to) {
        if(from && to) dateFormatted = `${utils.to_ddMMM(from)} - ${utils.to_ddMMM(to)}`;
        if(from && !to) dateFormatted = `After checkout`;
        if(!from && to) dateFormatted = `Before checkin`;
    } else if(date) {
        dateFormatted = `${utils.to_ddMMM(date)}`;
    }

    const doSubscribe = isToday || isThisWeek || noDates;

    const [expanded, setExpanded] = useState(isToday);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);

    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();

    const handleSetExpanded = async () => {
        setExpanded(prev => !prev);
    }

    const handleDeleteActivity = async (activity) => {
        onConfirm(`Are you sure you want to delete this ${activity.displayName}?`, async () => {
            if (!activity || utils.isEmpty(activity.id)) return;

            let deleteActivityResult = false;
            if (activity.category === "meal") {
                deleteActivityResult = mealService.removeMeal(activity, onError);
            } else {
                deleteActivityResult = await activityService.remove(activity, onError);
            }

            // Delete activity from the current GUI list
            if (deleteActivityResult !== false) {
                // If there's a activities update subscription, no need to manually adjust the state
                if(doSubscribe) return;

                const newActivities = activities.filter((act) => act.id !== activity.id);
                setActivities(newActivities);
            }
        });
    };

    // newActivity might be an update to an existing activity or an entirely new activity (e.g minibar sale)
    const onActivityChange = (updatedActivity) => {
        // If there's a activities update subscription, no need to manually adjust the state
        if(doSubscribe) return;

        if(!updatedActivity) {
            return onError(`Unexpected error: Cannot add new activity to current list`);
        }

        const newActivities = [...activities];

        const existingIndex = newActivities.findIndex((activity) => activity.id === updatedActivity.id);
        if(existingIndex !== -1) newActivities[existingIndex] = updatedActivity;
        else {
            newActivities.push(updatedActivity);
            newActivities.sort((a1, a2) => {
                if(utils.isDate(a1.startingAt) && utils.isDate(a2.startingAt)) {
                    return a1.startingAt - a2.startingAt;
                } else {
                    return -1;
                }
            });
        }
       
        setActivities(newActivities);

        return true;
    };

    const getActivities = async() => {
        let activities = [];
        if(customer) {
            activities = await activityService.get(customer, filter, onError);
        } else {
            activities = await activityService.getAll(filter, onError);
        }
        setActivities(activities);
        setLoading(false);
        setLastUpdate(utils.to_HHmm());
        return activities;
    };

    // Past activities reload when the date header is expanded
    useEffect(() => {
        if(expanded && !doSubscribe) {
            setLoading(prev => !prev);
            getActivities();
        }
    }, [expanded]);

    // Today's activities and the rest of the week reload whenever there is a change in DB
    useEffect(() => {
        if(doSubscribe) {
            const unsubscribe = activityService.subscribe(customer, (liveActivities) => {
                const enhancedLiveActivities = activityService.enhanceActivities(liveActivities);
                setActivities(enhancedLiveActivities);
                setLastUpdate(`${utils.to_HHmm()}`);
                setLoading(false);
            }, filter, onError);

            return () => unsubscribe !== null ? unsubscribe() : null;
        }
    }, []);

    return (
        <div>
            {/* If there's a data subscription, remove div if data is empty */}
            {(doSubscribe === false || activities.length > 0) && (<>
                <h3
                    className={'activity-group-header clickable-header'}
                    onClick={handleSetExpanded}
                >
                    <div className='activity-group-header-left'>
                        <div>
                            {`${dateFormatted}${(isToday ? ` | ${utils.to_HHmm()}` : "")}`}
                        </div>
                        
                    </div>

                    <div className='activity-group-header-right'>
                        {lastUpdate && (<>
                            {doSubscribe && (
                                <span className='subscription-notification'>•</span>
                            )}
                            <div className='last-updated-info'>
                                Last updated {lastUpdate}
                            </div>
                        </>)}
                        <span className="expand-icon">
                            {expanded ? ' ▼' : ' ▶'}
                        </span>
                    </div>
                </h3>
                {expanded && loading ? (
                    <Spinner />
                ) : expanded && !loading ? (
                    <div>
                        {activities.map((activity, index) => {
                            return (
                                <React.Fragment key={activity.id}>
                                    <ActivityComponent
                                        inputCustomer={customer}
                                        activity={activity}
                                        onActivityChange={(newActivity) => onActivityChange(newActivity)}
                                        context={context}
                                        handleDeleteActivity={() => handleDeleteActivity(activity)}
                                    />
                                </React.Fragment>
                            )
                        })}
                    </div>
                ) : (
                    null
                )}
            </>)}
        </div>
    )
}