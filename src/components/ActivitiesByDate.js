import React, { useState, useEffect, useRef } from 'react';
import ActivityComponent from './ActivityComponent.js';
import TodoComponent from "./TodoComponent.js";
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import { useNotification } from '../context/NotificationContext.js';
import * as utils from "../utils.js";
import Spinner from './Spinner.js';
import "./ActivitiesByDate.css";
import { update } from '../daos/userDao.js';
import * as todoService from "../services/todoService.js";

export default function ActivitiesByDate({ context, customer, date, date1, date2 }) {
    const today = utils.today();
    const includeTodos = true;
    
    let from = date1 ? date1.startOf('day') : null;
    let to = date2 ? date2.endOf('day') : null;

    if(date) {
        from = date.startOf('day');
        to = date.endOf('day');
    }

    // input date(s) define 1 particular day, not a range of dates
    const singleDate = utils.dateIsSame(to, from, true); 

    // Giving no dates means to get all the unscheduled activities
    const noDates = !from && !to;
    const isBeforeToday = utils.isBeforeToday(from) && utils.isBeforeToday(to);
    const isToday = singleDate && utils.isToday(from);
    const isThisWeek = (from !== null && to !== null) ? (from > today && to < utils.today(8)) : false;
    
    // if all input dates === null, then filter => {date: null}, which means getting unscheduled activities
    const filter = (from && to) ? { after: from, before: to } : {date : null};
    
    let dateFormatted = "Unscheduled";
    if(from || to) {
        if(from && to) {
            if(isToday) dateFormatted = `Today, ${utils.to_ddMMM(from)}`;
            else if(singleDate) dateFormatted = `${utils.to_www_ddMMM(from)}`;
            else dateFormatted = `${utils.to_www_ddMMM(from)} - ${utils.to_www_ddMMM(to)}`;
        }
        else if(from && !to) dateFormatted = `After checkout`;
        else if(!from && to) dateFormatted = `Before checkin`;
    } else if(date) {
        dateFormatted = `${utils.to_ddMMM(date)}`;
    }

    const doSubscribe = isToday || isThisWeek || noDates;

    const [expanded, setExpanded] = useState(isToday || doSubscribe);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [todos, setTodos] = useState([]);
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

    const handleDeleteTodo = async (todo) => {
        onConfirm(`Are you sure you want to delete this todo?`, async () => {
            if (!todo || utils.isEmpty(todo.id)) return;

            let deleteResult = await todoService.remove(todo, onError);

            // Delete from the current GUI list
            if (deleteResult !== false) {
                // If there's a subscription, no need to manually adjust the state
                if(doSubscribe) return;

                const newTodos = todos.filter((t) => t.id !== t.id);
                setTodos(newTodos);
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
            const todos_ = await todoService.get(null, filter, onError);
            setTodos(todos_);
        }
        setActivities(activities);
        setLoading(false);
        setLastUpdate(utils.to_HHmm());
        return activities;
    };

     const getTodos = async() => {
        if(!customer) {
            const todos_ = await todoService.get(null, filter, onError);
            setTodos(todos_);
            setLoading(false);
            setLastUpdate(utils.to_HHmm());
            return todos_;
        } 
        return [];
    };

    // Past activities reload when the date header is expanded
    useEffect(() => {
        if(expanded && !doSubscribe) {
            setLoading(prev => !prev);
            getActivities();
            getTodos();
        }
    }, [expanded]);

    // Today's activities and the rest of the week reload whenever there is a change in DB
    useEffect(() => {
        if(doSubscribe) {
            const unsubscribeActivities = activityService.subscribe(customer, (liveActivities) => {
                const enhancedLiveActivities = activityService.enhanceActivities(liveActivities);
                setActivities(enhancedLiveActivities);

                setLastUpdate(`${utils.to_HHmm()}`);
                setLoading(false);
            }, filter, onError);

            let unsubscribeTodos = null;
            if(customer === null && includeTodos) {
                unsubscribeTodos = todoService.subscribe((liveTodos) => {
                    setTodos(liveTodos);
                    setLastUpdate(`${utils.to_HHmm()}`);
                    setLoading(false);
                }, filter, onError);
            }

            return () => {
                if(unsubscribeActivities !== null) unsubscribeActivities();
                if(unsubscribeTodos !== null) unsubscribeTodos();
            }
        }
    }, []);

    const tasks = [...(activities || []), ...(todos||[])]
    const tasksSorted = tasks.sort((t1, t2) => {
        const date1 = utils.exists(t1, "startingAt") ? t1.startingAt : t1.deadlineAt;
        const date2 = utils.exists(t2, "startingAt") ? t2.startingAt : t2.deadlineAt;
        if(date1 === null) return -1;
        else if(date2 === null) return 1;
        return date1 - date2;
    });

    return (
        <div>
            {/* If there's a data subscription, remove div if data is empty */}
            {(doSubscribe === false || tasks.length > 0) && (<>
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
                        {tasksSorted.map((task, index) => {
                            let task_ = null;
                            if(utils.exists(task, "startingAt")) {
                                task_ = <ActivityComponent
                                    key={`activity-${task.id}`}
                                    inputCustomer={customer}
                                    activity={task}
                                    onActivityChange={(newActivity) => onActivityChange(newActivity)}
                                    context={context}
                                    handleDeleteActivity={() => handleDeleteActivity(task)}
                                />;
                            } else {
                                task_ = <TodoComponent
                                    key={`todo-${task.id}`}
                                    todo={task}
                                    context={context}
                                    handleDelete={() => handleDeleteTodo(task)}
                                />;
                            }
                            return task_;
                        })}
                    </div>
                ) : (
                    null
                )}
            </>)}
        </div>
    )
}