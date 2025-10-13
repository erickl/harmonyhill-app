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

export default function ActivityComponent({ showCustomer, activity, handleEditActivity, handleDeleteActivity, users, user, triggerRerender }) {
    const [customer,                setCustomer               ] = useState(null );
    const [activityInfo,            setActivityInfo           ] = useState(null );
    const [isManagerOrAdmin,        setIsManagerOrAdmin       ] = useState(false);
    const [loadingExpandedActivity, setLoadingExpandedActivity] = useState(false);
    const [expanded,                setExpanded               ] = useState(false);
    const [dishes,                  setDishes                 ] = useState([]   );
    const [status,                  setStatus                 ] = useState(null );
    const [alert,                   setAlert                  ] = useState(null );

    const { onError } = useNotification();
    const { onCountItems } = useItemsCounter();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();

    const handleActivityClick = async () => {
        setLoadingExpandedActivity(true);
        await loadActivityInfo();
        setLoadingExpandedActivity(false);
    }

    const handleActivityStatusChange = async (currentStatus) => {
        let newStatus = null;
        if(currentStatus.category === activityService.Status.GOOD_TO_GO) {
            newStatus = activityService.Status.STARTED;
        } else if(currentStatus.category === activityService.Status.STARTED) {
            newStatus = activityService.Status.COMPLETED;
        }
        if(newStatus !== null) {
            onConfirm(`Is the activity ${newStatus}?`, async() => {
                const success = await activityService.setActivityStatus(activity.bookingId, activity.id, newStatus);
                if(success) {
                    setStatus({ "category" : newStatus, "message" : newStatus}); // Shows the new status live without needing a rerender
                    onSuccess();
                }
            }); 
        }
    }

    const handleAssigneeStatusChange = async (accept) => {
        const result = await activityService.changeAssigneeStatus(accept, activity.bookingId, activity.id, onError);
        if(result) {
            triggerRerender();
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

    useEffect(() => {
        const getActivityInfo = async() => {
            const activityInfo = await activityService.getActivityMenuItem(activity.category, activity.subCategory, activity.house);
            setActivityInfo(activityInfo);

            const currentStatus = await activityService.getStatus(activity, onError);
            setStatus(currentStatus);

            const currentAlert = await activityService.getAlert(activity, currentStatus, activityInfo, onError);
            setAlert(currentAlert);
        }

        getActivityInfo();
    }, []);

    useEffect(() => {
        const setActivityCustomer = async() => {
            const customer = await getParent(activity);
            setCustomer(customer);
        }

        const setUserRole = async() => {
            const userRole = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userRole);
        }

        if(showCustomer) {
            setActivityCustomer();
        }
        
        setUserRole();
    }, []);

    const showProvider = activity && activity.category !== "meal" && activity.internal !== true && !utils.isEmpty(activity.provider);
    
    const assignedUser = users ? users.find(user => user.name === activity.assignedTo) : null;
    const assignedUserShortName = assignedUser ? assignedUser.shortName : "?";
    
    let assignedUserStyle = { backgroundColor: "#E12C2C" }
    if(assignedUserShortName !== "?") {
        assignedUserStyle = { backgroundColor: "green" };
        if(activity.assigneeAccept !== true) {
            assignedUserStyle = { backgroundColor: "#FFA500", color: "black" };
        }
    }
    
    const houseShortName = activity.house === "harmony hill" ? "HH" : "JN";
    const houseColor = houseShortName === "HH" ? "darkcyan" : "rgb(2, 65, 116)";

    return (<>
        <div className="activity-header" onClick={(e) => {
                e.stopPropagation();
                handleActivityClick(activity);
            }}>
            <div className="activity-header-left">
                <div className="activity-header-house" style={{ backgroundColor: houseColor }}>
                    {houseShortName}
                </div>
                <div className="activity-header-assignee" style={assignedUserStyle}>
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
                    {showCustomer ? activity.name : ""}
                </div>  
            </div>

            {status && (<div className="activity-header-status">
                <StatusCircle 
                    status={status.category} 
                    message={status.message}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleActivityStatusChange(status);
                    }}
                />
            </div>)}
            
            {alert && (<div className="activity-header-status">
                <AlertCircle 
                    status={alert.category} 
                    message={alert.message}
                />
            </div>)}

            {activity && activity.status === activityService.Status.COMPLETED && utils.isToday(activity.startingAt) && (
                <div className="activity-overlay" />
            )}
        </div>

        {loadingExpandedActivity ? (
            <Spinner />
        ) : expanded ? ( 
            <div className="activity-details">
                {activity.dietaryRestrictions && (<p><span className="detail-label">Dietary restrictions: </span><span className="dietaryRestrictions">{activity.dietaryRestrictions}</span></p>)}
                {activity.comments && (<p className="preserve-whitespaces"><span className="detail-label">Comments:</span> {activity.comments}</p>)}
                <p><span className="detail-label">Status:</span> {utils.capitalizeWords(activity.status)}</p>
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

                    { user && user.shortName === assignedUserShortName && !activity.assigneeAccept && (utils.isTomorrow(activity.startingAt) || utils.isToday(activity.startingAt)) && (
                        <div className="activity-component-footer-icon">
                            <ThumbsUp  
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssigneeStatusChange(true);
                                }}
                            />
                            <p>Accept task?</p>
                        </div>
                    )}

                    { user && user.shortName === assignedUserShortName && activity.assigneeAccept && (utils.isTomorrow(activity.startingAt) || utils.isToday(activity.startingAt)) &&  (
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

                    {activity.subCategory === "house-keeping" && utils.isToday(activity.startingAt) && (
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
