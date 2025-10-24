import React, { useState, useEffect } from 'react';
import * as activityService from "../services/activityService.js";
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import * as minibarService from "../services/minibarService.js";
import "./ActivityComponent.css";
import Spinner from './Spinner.js';
import {getParent} from "../daos/dao.js";
import * as userService from "../services/userService.js";
import { Pencil, Trash2, ThumbsUp, ThumbsDown, Candy } from 'lucide-react';
import DishesSummaryComponent from './DishesSummaryComponent.js';
import StatusCircle from './StatusCircle.js';
import AlertCircle from './AlertCircle.js';
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useItemsCounter } from "../context/ItemsCounterContext.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import MetaInfo from './MetaInfo.js';

const assigneeStyles = [
    { backgroundColor: "#E12C2C", color: "white" },
    { backgroundColor: "#FFA500", color: "black" },
    { backgroundColor: "green", color: "white"     }
];  

export default function ActivityComponent({ inputCustomer, inputActivity, handleEditActivity, handleDeleteActivity, users, user, triggerRerender }) {
    const assignedUser = users && inputActivity ? users.find(user => user.name === inputActivity.assignedTo) : null;
    const assignedUserShortName = assignedUser ? assignedUser.shortName : "?";
    
    const [customer,                setCustomer               ] = useState(null );
    const [activity,                setActivity               ] = useState(inputActivity);
    const [showCustomerInfo,        setShowCustomerInfo       ] = useState(false);
    const [activityInfo,            setActivityInfo           ] = useState(null );
    const [isManagerOrAdmin,        setIsManagerOrAdmin       ] = useState(false);
    const [loadingExpandedActivity, setLoadingExpandedActivity] = useState(false);
    const [expanded,                setExpanded               ] = useState(false);
    const [dishes,                  setDishes                 ] = useState([]   );
    const [status,                  setStatus                 ] = useState(null );
    const [alert,                   setAlert                  ] = useState(null );
    const [assigneeStyleIndex,      setAssigneeStyleIndex     ] = useState(0);
    const [minuteTicker,            setMinuteTicker           ] = useState(0);       

    const { onError } = useNotification();
    const { onCountItems } = useItemsCounter();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();

    const getAssigneeStyleIndex = () => {
        let newAssigneeStyleIndex = 0;
        if(assignedUserShortName !== "?") {
            newAssigneeStyleIndex = 1;
            if(activity.assigneeAccept === true) {
                newAssigneeStyleIndex = 2;
            }
        }

        return newAssigneeStyleIndex;
    };

    const handleActivityClick = async () => {
        setLoadingExpandedActivity(true);
        await loadActivityInfo();
        setLoadingExpandedActivity(false);
    }

    const canStartActivity = () => {
        const isGoodToGo = status && status.category === activityService.Status.GOOD_TO_GO;
        if(!isGoodToGo) {
            return false;
        }

        const now = utils.now();
        const minutesLeft = activity.startingAt.diff(now, 'minutes').minutes;
        if(minutesLeft < 10 && minutesLeft > -60) {
            return true;
        }

        return false;
    }

    const canCompleteActivity = () => {
        const isGoodToGo = status && status.category === activityService.Status.GOOD_TO_GO;
        const isStarted = status && status.category === activityService.Status.STARTED;
        const canStillStart = canStartActivity();

        const now = utils.now();
        const minutesLeft = activity.startingAt.diff(now, 'minutes').minutes;
        if(minutesLeft > 0) {
            return false;
        }

        if(isStarted) {
            return true;
        } else if(!isStarted && canStillStart) {
            return false;
        } else if(isGoodToGo) {
            return true;
        }

        return false;
    }

    const calculateActivityStatus = async(newStatus = null) => {
        if(!activity) return;

        let thisActivityInfo = activityInfo;
        if(!thisActivityInfo) {
            thisActivityInfo = await activityService.getActivityMenuItem(activity.category, activity.subCategory, activity.house);
            setActivityInfo(thisActivityInfo);
        }

        if(!newStatus) {
            newStatus = await activityService.getStatus(activity, onError);
        }
        setStatus(newStatus);

        const currentAlert = await activityService.getAlert(activity, newStatus.category, thisActivityInfo, onError);
        setAlert(currentAlert);

        return {activityInfo: thisActivityInfo, status: newStatus, alert: currentAlert};
    }

    const handleActivityStatusChange = async (newStatus) => {
        if(newStatus == null) return;
        const newStatusName = newStatus.category;

        onConfirm(`Set activity status to ${newStatusName}?`, async() => {
            const success = await activityService.setActivityStatus(activity.bookingId, activity.id, newStatusName);
            if(success) {
                let updatedActivity = { ...(activity || {}) };
                updatedActivity.status = newStatusName;
                setActivity(updatedActivity);
                onSuccess();
            }
        });
    }

    const handleAssigneeStatusChange = async (accept) => {
        const result = await activityService.changeAssigneeStatus(accept, activity.bookingId, activity.id, onError);
        if(result) {
            let updatedActivity = { ...(activity || {}) };
            updatedActivity.assigneeAccept = accept;
            setActivity(updatedActivity);
        }
    }

    const handleMinibarRefill = async() => {
        const minibarList = await minibarService.getSelection(onError);
        onCountItems(minibarList, async (refill) => {
            const result = await minibarService.add(activity.bookingId, activity.id, "refill", refill, onError); 
            if(result) {
                onSuccess();
            }
            return result;
        });
    }

    const loadActivityInfo = async () => {
        if(!activity) return;

        const expand = !expanded;

        if(expand) {
            if(activity.category === "meal") {
                // If this list is displayed for all customers, get the customer for each activity 
                const mealCustomer = customer ? customer : await getParent(activity);
                const dishes = await mealService.getMealDishes(mealCustomer.id, activity.id);
                setDishes(dishes);
            }
        }
        setExpanded(expand);
    };

    // Function to increment the ticker state every minute, because activity status changes depends on it
    // E.g. you can only press complete when the activity is past its due date
    useEffect(() => {
        const tick = () => {
            // Incrementing the ticker forces the component (and the other useEffect) to rerun
            setMinuteTicker(prev => prev + 1); 
        };

        const intervalId = setInterval(tick, 60000); //60k ms = 1min

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        calculateActivityStatus();

        const newAssigneeStyleIndex = getAssigneeStyleIndex();
        setAssigneeStyleIndex(newAssigneeStyleIndex);
    }, [activity, minuteTicker]);

    useEffect(() => {       
        const setActivityCustomer = async() => {
            let activityCustomer = inputCustomer;
            if(!activityCustomer) {
                // This means, this component is used in the activity list for all customers. Thus each activity needs to display customer name
                setShowCustomerInfo(true);
                activityCustomer = await getParent(activity);
            }
            
            setCustomer(activityCustomer);
        }

        const setUserRole = async() => {
            const userRole = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userRole);
        }

        setActivityCustomer();
        setUserRole();
    }, []);

    useEffect(() => {
        let timerId = null;

        if(!utils.isEmpty(activity.changeDescription)) {
            const toggleColor = () => {    
                setAssigneeStyleIndex(prevIndex => prevIndex === 1 ? 2 : 1);
            };

            timerId = setInterval(toggleColor, 500);
        }

        return () => {
            if(timerId) clearInterval(timerId);
        }
    }, []);

    const showProvider = activity && activity.category !== "meal" && activity.internal !== true && !utils.isEmpty(activity.provider);
    const houseShortName = inputActivity ? (inputActivity.house === "harmony hill" ? "HH" : "JN") : "?";
    const houseColor = houseShortName === "HH" ? "darkcyan" : "rgb(2, 65, 116)";

    if(!activity) {
        return <p>Loading...</p>;
    }

    const finalAssigneeStyle = assigneeStyles[assigneeStyleIndex];

    return (<>
        <div className="activity-header" onClick={(e) => {
                e.stopPropagation();
                handleActivityClick(activity);
            }}>
            <div className="activity-header-left">
                <div className="activity-header-house" style={{ backgroundColor: houseColor }}>
                    {houseShortName}
                </div>
                <div className="activity-header-assignee" style={finalAssigneeStyle}>
                    {assignedUserShortName}
                </div>
            </div>

            <div className="activity-header-time">
                <span className="preserve-whitespaces">{activity.startingAt_HHmm}</span>
            </div>

            <div className="activity-header-right">
                <div className="activity-header-name">
                    {activity.displayName}
                </div>  
                <div className="activity-header-provider">
                    {activity.provider}
                </div>  
                <div className="activity-header-guest">
                    {showCustomerInfo === true ? activity.name : ""}
                </div>  
            </div>

            {/* Display ongoing status of the activity */}
            {status && (<div className="activity-header-status">
                <StatusCircle 
                    status={status.category} 
                />
            </div>)}
            
            {/* Display alert when something needs to be fixed urgently  */}
            {alert && (<div className="activity-header-status">
                <AlertCircle 
                    status={alert.category} 
                />
            </div>)}

            {/* Grey out the activity header to show it's completed */}
            {/* {activity && activity.status === activityService.Status.COMPLETED && utils.isToday(activity.startingAt) && (
                <div className="activity-overlay" />
            )} */}
        </div>

        {loadingExpandedActivity ? (
            <Spinner />
        ) : expanded ? ( 
            <div className="activity-details">
                {alert && !utils.isEmpty(alert.message) && (
                    <p>
                        <span className="detail-label">Alert: </span>
                        <span className="important-badge">{alert.message}</span> 
                    </p>
                )}
                {activity.category === "meal" && customer && !utils.isEmpty(customer.dietaryRestrictions) && (
                    <p>
                        <span className="detail-label">Dietary restrictions: </span>
                        <span className="important-badge">{customer.dietaryRestrictions}</span>
                    </p>
                )}

                {activity.comments && (
                    <p className="preserve-whitespaces">
                        <span className="detail-label">Comments:</span> 
                            {activity.comments}
                    </p>
                )}
                
                <p><span className="detail-label">Status:</span> {utils.capitalizeWords(status.message)}</p>
                
                { showProvider && (<>
                    <p><span className="detail-label">Provider:</span> {activity.provider}</p>
                    { isManagerOrAdmin && ( <p><span className="detail-label">Provider Price:</span> {utils.formatDisplayPrice(activity.providerPrice)}</p> )}
                </>)}
                <p><span className="detail-label">Customer Price:</span> {utils.formatDisplayPrice(activity.customerPrice, true) ?? 0 }</p>

                {/* List dishes if the activity expanded is a meal */}
                {activity.category === "meal" && (
                    <DishesSummaryComponent dishes={dishes} />
                )}

                { !utils.isEmpty(activity.changeDescription) && (
                    <div style={{color:"red"}}>
                        <p className="preserve-whitespaces">
                            <span className="detail-label">Change:</span> 
                            {activity.changeDescription.map((change) => {
                                return (<p>• {change}</p>)
                            })}
                        </p>
                    </div>
                )}

                <div className="activity-component-footer">
                    <div className="activity-component-footer-icon">
                        <Pencil   
                            onClick={(e) => {
                                e.stopPropagation();
                                if(!utils.isEmpty(dishes)) {
                                    activity.dishes = dishes;
                                }
                                handleEditActivity(activity);
                            }}
                        />
                        <p>Edit</p>
                    </div>
                    {isManagerOrAdmin && (
                        <div className="activity-component-footer-icon">
                            <Trash2  
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity();
                                }}
                            />
                            <p>Delete</p>
                        </div>
                    )}

                    { user && user.shortName === assignedUserShortName && !activity.assigneeAccept && (<>
                        { (utils.isTomorrow(activity.startingAt) || utils.isToday(activity.startingAt)) ? (

                            <div className="activity-component-footer-icon">
                                <ThumbsUp  
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssigneeStatusChange(true);
                                    }}
                                />
                                <p>Accept task?</p>
                            </div>
                        ) : (
                            <div className="activity-component-footer-icon">
                                <ThumbsUp  
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onError("Only available from 1 day before, and if all activity info is provided");
                                    }}
                                />
                                <p>Unavailable</p>
                            </div>
                        )}
                    </>)}

                    { user && user.shortName === assignedUserShortName && 
                        activity.assigneeAccept && 
                        activity.status !== "started" &&
                        (!utils.isPast(activity.startingAt)) &&  (

                        <div className="activity-component-footer-icon">
                            <ThumbsDown  
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssigneeStatusChange(false);
                                }}
                            />
                            <p>Decline task?</p>
                        </div>
                    )}

                    {/* Todo (dev-100): for this, we have to fetch the dishes, which we normally don't do until the activity details component is expanded */}
                    {/* Mark activity started */}
                    { false && canStartActivity() && (
                        <div className="activity-component-footer-icon">
                            <StatusCircle 
                                status={activityService.Status.STARTED} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivityStatusChange(activityService.status(activityService.Status.STARTED));
                                }}
                            />
                            <p>Start it</p>
                        </div>
                    )}

                    {/* Todo (dev-100): for this, we have to fetch the dishes, which we normally don't do until the activity details component is expanded */}
                    {/* Mark activity started */}
                    { false && canCompleteActivity() && (
                        <div className="activity-component-footer-icon">
                            <StatusCircle 
                                status={activityService.Status.COMPLETED} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivityStatusChange(activityService.status(activityService.Status.COMPLETED));
                                }}
                            />
                            <p>Complete it</p>
                        </div>
                    )}

                    {false && /*todo: complete minibar func first*/ activity && activity.subCategory === "house-keeping" && utils.isToday(activity.startingAt) && (
                        <div className="activity-component-footer-icon">
                            <Candy  
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMinibarRefill();
                                }}
                            />
                            <p>Minibar Refill</p>
                        </div>
                    )}
                </div> 
                <MetaInfo document={activity}/>
            </div>
        ) : ( 
            <></>
        )}
    </>);
};
