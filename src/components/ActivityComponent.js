import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import * as activityService from "../services/activityService.js";
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import "./ActivityComponent.css";
import Spinner from './Spinner.js';
import {getParent} from "../daos/dao.js";
import * as userService from "../services/userService.js";
import { Pencil, ShoppingCart, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import DishesSummaryComponent from './DishesSummaryComponent.js';
import ErrorNoticeModal from './ErrorNoticeModal.js';
import StatusCircle, {Status} from './StatusCircle.js';

export default function ActivityComponent({ showCustomer, activity, handleEditActivity, handleDeleteActivity, users, user, triggerRerender }) {
    const [customer,                setCustomer               ] = useState(null );
    const [activityInfo,            setActivityInfo           ] = useState(null );
    const [isManagerOrAdmin,        setIsManagerOrAdmin       ] = useState(false);
    const [loadingExpandedActivity, setLoadingExpandedActivity] = useState(false);
    const [expanded,                setExpanded               ] = useState(false);
    const [dishes,                  setDishes                 ] = useState([]   );
    const [errorMessage,            setErrorMessage           ] = useState(null );

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    const handleActivityClick = async () => {
        setLoadingExpandedActivity(true);
        await loadActivityInfo();
        setLoadingExpandedActivity(false);
    }

    const handleAssigneeStatusChange = async (accept) => {
        const thisCustomer = customer ? customer : await getParent(activity);
        const result = await activityService.changeAssigneeStatus(accept, thisCustomer.id, activity.id, onError);
        if(result) {
            triggerRerender();
        }
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
         const getActivityInfo = async () => {
            const activityInfo = await activityService.getActivityMenuItem(activity.category, activity.subCategory, activity.house);
            setActivityInfo(activityInfo);
        }
        getActivityInfo();
    }, []);

    useEffect(() => {
        const getCustomer = async() => {
            const customer = await getParent(activity);
            setCustomer(customer);
        }

        const setUserRole = async() => {
            const userRole = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userRole);
        }

        if(showCustomer) {
            getCustomer();
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

    let status = Status.NONE;
    let statusMessage = "";
    if(activity && activity.startingAt && !utils.wasYesterday(activity.startingAt)) {
        let timeLeft = activity.startingAt.diff(utils.now(), ["hours"]);
        timeLeft = Math.floor(timeLeft.hours);

        const stillNeedsAssignee = utils.isEmpty(activity.assignedTo);

        const startingDayMinusOne = activity.startingAt.startOf("day").minus({days: 1});
        const isDayBefore = utils.today().equals(startingDayMinusOne);

        if(isDayBefore && stillNeedsAssignee) {
            status = Status.ATTENTION;
            statusMessage = "Assign someone";
        }

        const providerEmpty = utils.isEmpty(activity.provider);
        let stillNeedsProvider = activityInfo && activityInfo.internal === false && providerEmpty;
        
        // If the check box is checked to say this custom activity needs a provider, take that into account
        if(utils.exists(activity, "needsProvider") && utils.isBoolean(activity.needsProvider)) {
            stillNeedsProvider = providerEmpty && activity.needsProvider;
        }
       
        if(stillNeedsProvider) {
            statusMessage = "Needs Provider";
            status = Status.ATTENTION; 

            if(activityInfo && activityInfo.deadline1 !== 0 && timeLeft <= activityInfo.deadline1) {
                statusMessage = "Assign Provider!";
                status = Status.URGENT;
            }
            if(activityInfo && activityInfo.deadline2 !== 0 && timeLeft <= activityInfo.deadline2) {
                statusMessage = "Assign Provider!!!";
                status = Status.EMERGENCY;
            }
        } 
    }

    return (<>
        <div className="activity-header" onClick={() => handleActivityClick(activity)}>
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
            <div className="activity-header-status">
                <StatusCircle status={status} message={statusMessage}/>
            </div>
        </div>
        {loadingExpandedActivity ? (
            <Spinner />
        ) : expanded ? ( 
        <div className="activity-details">
            {/* {customer !== null && (<p><span className="detail-label">Customer Name:</span> {customer.name}</p>)} */}
            {customer !== null && (<p><span className="detail-label">Villa:</span> {utils.capitalizeWords(customer.house)}</p>)}
            <p><span className="detail-label">Created By:</span> {activity.createdBy}</p>
            <p><span className="detail-label">Created At:</span> {activity.createdAt_ddMMM_HHmm}</p>
            {activity.dietaryRestrictions && (<p><span className="detail-label">Dietary restrictions: </span><span className="dietaryRestrictions">{activity.dietaryRestrictions}</span></p>)}
            {activity.comments && (<p className="preserve-whitespaces"><span className="detail-label">Comments:</span> {activity.comments}</p>)}
            <p><span className="detail-label">Status:</span> {utils.capitalizeWords(activity.status)}</p>
            { showProvider && (<>
                <p><span className="detail-label">Provider:</span> {activity.provider}</p>
                { isManagerOrAdmin && ( <p><span className="detail-label">Provider Price:</span> {utils.formatDisplayPrice(activity.providerPrice)}</p> )}
            </>)}
            <p><span className="detail-label">Assigned To:</span> {activity.assignedTo}</p>
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

                { user && user.shortName === assignedUserShortName && !activity.assigneeAccept && (
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

                { user && user.shortName === assignedUserShortName && activity.assigneeAccept && (
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

                {errorMessage && (
                    <ErrorNoticeModal 
                        error={errorMessage}
                        onClose={() => setErrorMessage(null) }
                    />
                )}
            </div>   
        </div>
        ) : ( <></>)}
    </>);
};
