import React, { useState, useEffect, useRef } from 'react';
import ActivityComponent from './ActivityComponent.js';
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import { useNotification } from '../context/NotificationContext.js';
import * as utils from "../utils.js";
import Spinner from './Spinner.js';
import "./ActivitiesByDay.css";
import { update } from '../daos/userDao.js';

export default function ActivitiesByDay({ context, customer, date }) {
    const today = utils.today();
    const isPast = utils.isPast(date.startOf('day'));
    const isToday = utils.isToday(date);
    const isAfterToday = utils.isAfterToday(date);
    const isThisWeek = date > today && date < utils.today(7);
    const dayEnd = date.endOf('day');
    const dayStart = date.startOf('day');
    const filter = { after: dayStart, before: dayEnd };
    const dateFormatted = utils.to_ddMMM(date);
    const doSubscribe = isToday || isThisWeek;

    const [expanded, setExpanded] = useState(isToday);
    const [loading, setLoading] = useState(false);
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

        // what to do if there's no existing activity, but a new one?
        setActivities(prev =>
            prev.map(activity =>
                activity.id === updatedActivity.id ? updatedActivity : activity
            )
        );

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
            setLoading(true);
            if(isPast) {
                setLoading(prev => !prev);
                getActivities();
            }
        }
    }, [expanded]);

    // Today's activities and the rest of the week reload whenever there is a change in DB
    useEffect(() => {
        if(doSubscribe) {
            const unsubscribe = activityService.subscribeAll((liveActivities) => {
                const enhancedLveActivities = activityService.enhanceActivities(liveActivities);
                setActivities(enhancedLveActivities);
                setLastUpdate(`${utils.to_HHmm()}`);
                setLoading(false);
            }, filter, onError);

            return () => unsubscribe();
        }
    }, []);

    return (
        <div>
            <h3
                className={'activity-group-header clickable-header'}
                onClick={handleSetExpanded}
            >
                <div className='activity-group-header-left'>
                    <div>
                        {`${dateFormatted}${(isToday ? ` | ${utils.to_HHmm()}` : "")} | (${activities.length})`}
                    </div>
                    
                </div>

                <div className='activity-group-header-right'>
                    {activities.length > 0 &&  (<>
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
                    </>)}
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
        </div>
    )
}