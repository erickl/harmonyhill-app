import React, { useState, useEffect, useRef } from 'react';
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import ActivityComponent from './ActivityComponent';
import EditPurchaseScreen from './EditPurchaseScreen.js';
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import "./ActivityComponent.css";
import ConfirmModal from './ConfirmModal.js';
import { useNotification } from "../context/NotificationContext.js";
import {getParent} from "../daos/dao.js";

export default function ActivitiesList({onNavigate, customer, expandAllDates}) {
    const [expandedDates,           setExpandedDates    ] = useState({}   ); 
    const [activitiesByDate,        setActivitiesByDate ] = useState({}   );
    const [users,                   setUsers            ] = useState([]   );
    const [user,                    setUser             ] = useState(null );
    const [triggerRerender,         setTriggerRerender  ] = useState(0    );
    const [activityToEdit,          setActivityToEdit   ] = useState(null );
    const [activityToDelete,        setActivityToDelete ] = useState(null );
    const [loading,                 setLoading          ] = useState(true );
    const [currentCustomer,         setCurrentCustomer  ] = useState(null );

    const todaysHeader = useRef(null);

    const getCustomer = async(activity) => {
        return customer ? customer : await getParent(activity);
    };

    const { onError } = useNotification();

    const handleEditActivity = async(activity) => {
        if(activity) {
            const activityCustomer = await getCustomer(activity);
            setCurrentCustomer(activityCustomer);
            setActivityToEdit(activity); 
        }
    }

    const handleDeleteActivity = async () => {
        if(!activityToDelete || utils.isEmpty(activityToDelete.id)) {
            return;
        }
        const activityCustomer = await getCustomer(activityToDelete);
        if(!activityCustomer || utils.isEmpty(activityCustomer.id)) {
            onError(`Can't find customer for activity ${activityToDelete.id}`);
        }
        const deleteActivityResult = await activityService.remove(activityCustomer.id, activityToDelete.id, onError);
        if(deleteActivityResult) {
            setActivityToDelete(null);
            setCurrentCustomer(null);
        } 
    };

    const handleSetExpandedDates = (date) => {
        let updatedExpandedList = { ...(expandedDates || {}) }; // Make shallow copy
        updatedExpandedList[date] = updatedExpandedList[date] === true ? false : true;
        setExpandedDates(updatedExpandedList);
    };

    const loadPermissions = async () => {
        const canSeeAllBookings = await userService.canSeeAllBookings();
        return canSeeAllBookings;
    };

    const today_ddMMM = utils.to_ddMMM(utils.today());

    useEffect(() => {
        const getUsers = async() => {
            const allUsers = await userService.getUsers();
            setUsers(allUsers);
        };

        const getUser = async() => {
            const thisUser = await userService.getCurrentUser();
            setUser(thisUser);
        }

        getUsers();
        getUser();   
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
                const userCanSeeAllBookings = await loadPermissions();       
                const after = userCanSeeAllBookings  ? utils.now(-7) : utils.now(-2);
                const before = userCanSeeAllBookings ? utils.now(30) : utils.now(7);
                const filter = {"after" : after, "before" : before};
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

        // Only refresh activity list, after editing/deleting activity. Afterwards the variable is set to null
        if (activityToDelete === null && activityToEdit === null) {
            getActivities();
        }
    }, [customer, triggerRerender, activityToDelete, activityToEdit]);

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
            />
        );
    }

    if(Object.keys(activitiesByDate).length === 0) {
        return (<div><h2>No activities yet</h2></div>);
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
                                {`${date}${(isTodaysHeader ? " (Today)" : "")}`}
                                
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
                                                    handleDeleteActivity={() => setActivityToDelete(activity)}
                                                    users={users}
                                                    user={user}
                                                    triggerRerender={() => setTriggerRerender(triggerRerender+1)}
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

            {activityToDelete && (
                <ConfirmModal 
                    onCancel={() => setActivityToDelete(null)}
                    onConfirm={handleDeleteActivity}
                />
            )}
        </div>
    );
};
