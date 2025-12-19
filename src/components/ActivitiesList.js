import React, { useState, useEffect, useRef } from 'react';
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import ActivityComponent from './ActivityComponent.js';
import EditPurchaseScreen from './EditPurchaseScreen.js';
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import "./ActivityComponent.css";
import ConfirmModal from './ConfirmModal.js';
import { useNotification } from "../context/NotificationContext.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import {getParent} from "../daos/dao.js";

export default function ActivitiesList({onNavigate, from, to, customer, expandAllDates, triggerRerender}) {
    const [expandedDates,           setExpandedDates    ] = useState({}   ); 
    const [activitiesByDate,        setActivitiesByDate ] = useState({}   );
    const [users,                   setUsers            ] = useState([]   );
    const [user,                    setUser             ] = useState(null );

    const [activityToEdit,          setActivityToEdit   ] = useState(null );
    const [loading,                 setLoading          ] = useState(true );
    const [currentCustomer,         setCurrentCustomer  ] = useState(null );

    const todaysHeader = useRef(null);

    const getCustomer = async(activity) => {
        return customer ? customer : await getParent(activity);
    };

    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();

    const handleEditActivity = async(activity) => {
        if(activity) {
            const activityCustomer = await getCustomer(activity);
            setCurrentCustomer(activityCustomer);
            setActivityToEdit(activity); 
        }
    }

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
        let updatedExpandedList = { ...(expandedDates || {}) }; // Make shallow copy
        updatedExpandedList[date] = updatedExpandedList[date] === true ? false : true;
        setExpandedDates(updatedExpandedList);
    };

    const today_ddMMM = utils.to_ddMMM(utils.today(0, false));

    useEffect(() => {
        const getUsers = async() => {
            const allUsers = await userService.getUsers();
            setUsers(allUsers);

            const thisUser = await userService.getCurrentUser();
            setUser(thisUser);
        };

        getUsers();
    }, []);

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

        // Only refresh activity list, after editing activity. Afterwards the variable is set to null
        if (activityToEdit === null) {
            getActivities();
        }
    }, [customer, triggerRerender, activityToEdit]);

    if (loading) {
        return (
            <div className="fullscreen">
                <div className="card-content">
                    <p>Loading activity data...</p>
                </div>
            </div>
        );
    }
    
    if(activityToEdit && currentCustomer) {
        return (
            <EditPurchaseScreen
                customer={currentCustomer}
                activityToEdit={activityToEdit}
                onClose={() => {
                    setActivityToEdit(null);
                    setCurrentCustomer(null);
                }}
                onNavigate={onNavigate}
                triggerRerender={triggerRerender}
            />
        );
    }

    if(Object.keys(activitiesByDate).length === 0) {
        return (<div><h2>No activities</h2></div>);
    }

    return (
        <div className="card-content">
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
                                {`${date}${(isTodaysHeader ? ` (Today) | ${utils.to_HHmm()}` : "")}`}
                                
                                <span className="expand-icon">
                                    {expandedDates[date] ? ' ▼' : ' ▶'}
                                </span>
                            </h3>
                            {expandedDates[date] ? (
                                <div>
                                    {activities.map((activity) => {
                                        return (
                                            <React.Fragment key={activity.id}>   
                                                <ActivityComponent 
                                                    inputCustomer={customer}
                                                    inputActivity={activity}
                                                    handleEditActivity={handleEditActivity}
                                                    handleDeleteActivity={() => handleDeleteActivity(activity)}
                                                    users={users}
                                                    user={user}
                                                    triggerRerender={triggerRerender}
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
                )
            })}
        </div>
    );
};
