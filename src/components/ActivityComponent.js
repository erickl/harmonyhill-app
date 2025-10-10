import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import * as activityService from "../services/activityService.js";
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import * as minibarService from "../services/minibarService.js";
import "./ActivityComponent.css";
import Spinner from './Spinner.js';
import {getParent} from "../daos/dao.js";
import * as userService from "../services/userService.js";
import { Pencil, ShoppingCart, Trash2, ThumbsUp, ThumbsDown, Candy } from 'lucide-react';
import DishesSummaryComponent from './DishesSummaryComponent.js';
import StatusCircle, {Status} from './StatusCircle.js';
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useItemsCounter } from "../context/ItemsCounterContext.js";
import {get as getIncome} from "../services/incomeService.js";
import MetaInfo from './MetaInfo.js';

export default function ActivityComponent({ showCustomer, activity, handleEditActivity, handleDeleteActivity, users, user, triggerRerender }) {
    const [customer,                setCustomer               ] = useState(null );
    const [activityInfo,            setActivityInfo           ] = useState(null );
    const [isManagerOrAdmin,        setIsManagerOrAdmin       ] = useState(false);
    const [loadingExpandedActivity, setLoadingExpandedActivity] = useState(false);
    const [expanded,                setExpanded               ] = useState(false);
    const [dishes,                  setDishes                 ] = useState([]   );
    const [needsCommission,         setNeedsCommission        ] = useState(false);
    const [commission,              setCommission             ] = useState(null );

    const { onError, onInfo } = useNotification();
    const {onCountItems} = useItemsCounter();
    const {onSuccess} = useSuccessNotification();

    const handleActivityClick = async () => {
        setLoadingExpandedActivity(true);
        await loadActivityInfo();
        setLoadingExpandedActivity(false);
    }

    const handleActivityStatusChange = async (currentStatus) => {
        if(currentStatus === Status.GOOD_TO_GO) {
            const success = await activityService.setActivityStatus(activity.bookingId, activity.id, Status.COMPLETED);
        } 
    }

    const handleAssigneeStatusChange = async (accept) => {
        const thisCustomer = customer ? customer : await getParent(activity);
        const result = await activityService.changeAssigneeStatus(accept, thisCustomer.id, activity.id, onError);
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

        // If customer paid to provider, instead of to us, we should get a commission from the provider
        const checkCommission = async() => {
            const noCustomerPrice = !utils.exists(activity, "customerPrice") || utils.isEmpty(activity.customerPrice) || activity.customerPrice == 0;
            const providerPriceExists = utils.isNumber(activity.providerPrice) && activity.providerPrice > 0;   
            const isPast = utils.isPast(activity.startingAt);
            
            const commissions = await getIncome({activityId : activity.id}, onError);
            const commission = commissions.length > 0 ? commissions[0] : null;

            const needsCommissionNow = noCustomerPrice && providerPriceExists && isPast;
            const needsCommissionLater = noCustomerPrice && providerPriceExists && !isPast;

            // Commission is needed now
            if(needsCommissionNow) {
                setNeedsCommission(true);
            // No commission yet exists, but for now it's okay
            } else if(needsCommissionLater && commission) {
                setNeedsCommission(true);
            // If commission exists, this must be corrected
            } else if(!needsCommissionLater && commission) {
                setNeedsCommission(false);
            }

            setCommission(commission);
        }

        const setUserRole = async() => {
            const userRole = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userRole);
        }

        if(showCustomer) {
            getCustomer();
        }
        
        setUserRole();
        checkCommission();
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

    if(activity) {
        if(activity.startingAt && !utils.wasYesterday(activity.startingAt)) {
            let timeLeft = activity.startingAt.diff(utils.now(), ["hours"]);
            timeLeft = Math.floor(timeLeft.hours);

            const stillNeedsAssignee = utils.isEmpty(activity.assignedTo);

            const startingDayMinusOne = activity.startingAt.startOf("day").minus({days: 1});
            const today = utils.today();

            // Starting from the day before, display warning to assign someone
            if(today.diff(startingDayMinusOne) > 0 && stillNeedsAssignee) {
                status = Status.ATTENTION;
                statusMessage = "Assign staff";
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

        // if(status === Status.NONE) {
        //     status = Status.GOOD_TO_GO;
        //     statusMessage = "All Set";
        // }
    }             

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

            {needsCommission && !commission ? (
                <div className="activity-header-status">
                    <StatusCircle 
                        status={Status.URGENT} 
                        message={"Commission Missing"}
                    />
                </div>
            ) : !needsCommission && commission ? (
                <div className="activity-header-status">
                    <StatusCircle 
                        status={Status.URGENT} 
                        message={"Commission Not Needed"}
                    />
                </div>
            ) : (<></>)}
            
            <div className="activity-header-status">
                <StatusCircle 
                    status={status} 
                    message={statusMessage}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleActivityStatusChange(status);
                    }}
                />
            </div>
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

                    { user && user.shortName === assignedUserShortName && !activity.assigneeAccept && !utils.wasYesterday(activity.startingAt) && (
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

                    { user && user.shortName === assignedUserShortName && activity.assigneeAccept && !utils.wasYesterday(activity.startingAt) &&  (
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
