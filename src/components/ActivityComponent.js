import React, { useState, useEffect } from 'react';
import * as activityService from "../services/activityService.js";
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import * as minibarService from "../services/minibarService.js";
import * as inventoryService from "../services/inventoryService.js";
import "./ActivityComponent.css";
import Spinner from './Spinner.js';
import { getParent } from "../daos/dao.js";
import * as userService from "../services/userService.js";
import { Pencil, Trash2, ThumbsUp, ThumbsDown, Candy, Camera, Image } from 'lucide-react';
import DishesSummaryComponent from './DishesSummaryComponent.js';
import StatusCircle from './StatusCircle.js';
import AlertCircle from './AlertCircle.js';
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import { useCameraModal } from '../context/CameraContext.js';
import { useImageCarousel } from '../context/ImageCarouselContext.js';
import { useMinibarTableModal } from '../context/MinibarTableContext.js';
import MetaInfo from './MetaInfo.js';
import PhotoUploadButton from "./PhotoUploadButton.js";
import * as ActivityStatus from "../models/ActivityStatus.js";

import { motion } from "framer-motion";

const assigneeStyles = [
    { backgroundColor: "#E12C2C", color: "white" },
    { backgroundColor: "#FFA500", color: "black" },
    { backgroundColor: "green", color: "white" }
];

export default function ActivityComponent({ inputCustomer, activity, onActivityChange, onNavigate, onClose, handleDeleteActivity, users, user }) {
    const useActivityStartedStatus = true;

    const assignedUser = users && activity ? users.find(user => user.name === activity.assignedTo) : null;
    const assignedUserShortName = assignedUser ? assignedUser.shortName : "?";
    const houseShortName = activity ? (activity.house === "harmony hill" ? "HH" : "JN") : "?";

    const [customer, setCustomer] = useState(null);
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);
    const [activityInfo, setActivityInfo] = useState(null);
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [loadingExpandedActivity, setLoadingExpandedActivity] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [dishes, setDishes] = useState([]);
    const [dishesPrice, setDishesPrice] = useState(null);
    const [status, setStatus] = useState(null);
    const [alert, setAlert] = useState(null);
    const [assigneeStyleIndex, setAssigneeStyleIndex] = useState(0);
    const [minuteTicker, setMinuteTicker] = useState(0);
    const [requiredPhotosUploaded, setRequiredPhotosUploaded] = useState(false);
    const [minibarCount, setMinibarCount] = useState(null);
    const [photos, setPhotos] = useState([]);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();
    const { onDisplayMinibarTable } = useMinibarTableModal();

    const getAssigneeStyleIndex = () => {
        let newAssigneeStyleIndex = 0;
        if (assignedUserShortName !== "?") {
            newAssigneeStyleIndex = 1;
            if (activity.assigneeAccept === true) {
                newAssigneeStyleIndex = 2;
            }
        }

        return newAssigneeStyleIndex;
    };

    const countMinibarNow = minibarCount === null && activity && ActivityStatus.Started.equals(activity.status) && utils.isToday(activity.startingAt);
    const minibarCountAnimation = countMinibarNow ? { scale: [1, 1.1, 1], opacity: [1, 0.5, 1] } : {};
    const minibarCountTransition = countMinibarNow ? { duration: 1.5, ease: "easeInOut", repeat: Infinity } : {};

    const getAndSetActivityInfo = async () => {
        if (!activity) return null;

        let thisActivityInfo = activityInfo;
        if (!thisActivityInfo) {
            thisActivityInfo = await activityService.getActivityType(activity.category, activity.subCategory, activity.house);
            setActivityInfo(thisActivityInfo);
        }

        return thisActivityInfo;
    };

    const canStartActivity = () => {
        if (!useActivityStartedStatus) return false;

        const isGoodToGo = ActivityStatus.GoodToGo.equals(status);
        if (!isGoodToGo) {
            return false;
        }

        return utils.isToday(activity.startingAt);
    }

    const requiresMinibarCount = () => {
        if (minibarCount !== null) return false;
        if (activity.subCategory === "checkin-prep") return true;
        if (activity.subCategory === "housekeeping") return true;
        if (activity.subCategory === "checkout") return true;
        return false;
    }

    const canAddPhotos = () => {
        const isCompleted = ActivityStatus.Completed.equals(status);
        if (isCompleted) return false;

        const isStarted = ActivityStatus.Started.equals(status);
        if (isStarted) return true;

        const isGoodToGo = ActivityStatus.GoodToGo.equals(status);
        if (!isGoodToGo) return false;

        // If it's already past the 'Started' stage, we can go from 'Good To Go' to 'Completed', if required photos has been uploaded
        const now = utils.now();
        const minutesLeft = activity.startingAt.diff(now, 'minutes').minutes;
        const tooLateToStart = minutesLeft < -60;

        return tooLateToStart && isGoodToGo;
    }

    const canCompleteActivity = () => {
        if (!useActivityStartedStatus) return false;

        const activityRequiresMinibarCount = requiresMinibarCount();
        if (activityRequiresMinibarCount) {
            return false;
        }

        const isGoodToGo = ActivityStatus.GoodToGo.equals(status);
        const isStarted = ActivityStatus.Started.equals(status);
        const canStillStart = canStartActivity();

        // Cannot Complete 15 minutes before the activity is scheduled to start
        const now = utils.now();
        const minutesLeft = activity.startingAt.diff(now, 'minutes').minutes;
        if (minutesLeft > 15) {
            return false;
        }

        // If photos are required, see that they've been uploaded
        if (isStarted && requiredPhotosUploaded) {
            return true;
        } else if (!isStarted && canStillStart) {
            return false;
        } else if (isGoodToGo && requiredPhotosUploaded) {
            return true;
        }

        return false;
    }

    const calculateActivityStatus = async (newStatus = null) => {
        if (!activity) return;

        let thisActivityInfo = await getAndSetActivityInfo();

        if (!newStatus) {
            newStatus = await activityService.getStatus(activity, thisActivityInfo, onError);
        }
        setStatus(newStatus);

        const currentAlert = await activityService.getAlert(activity, newStatus, thisActivityInfo, onError);
        setAlert(currentAlert);

        return { activityInfo: thisActivityInfo, status: newStatus, alert: currentAlert };
    }

    const handleSetActivityStatusManually = async (newStatus) => {
        if (newStatus == null) return;

        let confirmationText = `Set activity status to ${newStatus.name}?`;
        const minutesLeft = activity.startingAt.diff(utils.now(), 'minutes').minutes;

        if (ActivityStatus.Started.equals(newStatus)) {
            if (minutesLeft > 30) {
                confirmationText = `Are you sure you want set activity status to ${newStatus.name}? It's still a bit early?`;
            }
        }

        onConfirm(confirmationText, async () => {
            const result = await activityService.setActivityStatus(activity, newStatus.name, onError);
            if (result !== false) {
                const updatedActivity = {
                    ...(activity || {}),
                    ...result
                };
                const updateActivityListResult = onActivityChange(updatedActivity);
                if (updateActivityListResult !== false) onSuccess();
            }
        });
    }

    const handleAssigneeStatusChange = async (accept) => {
        const result = await activityService.changeAssigneeStatus(accept, activity.bookingId, activity.id, onError);
        if (result !== false) {
            const updatedActivity = {
                ...(activity || {}),
                ...result
            };

            const updateActivityListResult = onActivityChange(updatedActivity);
            if (updateActivityListResult !== false) onSuccess();
        }
    }

    const onSubmitStockCount = async (stockCountList) => {
        const inventory = {
            items: stockCountList,
            activityId: activity.id,
            bookingId: customer.id,
        };

        if (activity.subCategory === "checkin-prep") inventory.type = "start";
        if (activity.subCategory === "housekeeping") inventory.type = "refill";
        if (activity.subCategory === "checkout") inventory.type = "end";

        const result = await minibarService.addOrEdit(activity, inventory, onError);
        if (result !== false) {
            if (result.minibarMeal) {
                const updateActivityListResult = onActivityChange(result.minibarMeal);
                if (updateActivityListResult === false) return false;
            }
            setMinibarCount(inventory.items);
            onSuccess();
        }

        return result;
    }

    const onDisplayMinibarCount = async () => {
        //const stockList = await minibarService.getSelection(onError);
        const stockList = await inventoryService.get({ type: "minibar" });

        if (stockList === false) return false;
        const houseShortLowerCase = houseShortName.toLowerCase();

        const stockListItems = stockList.reduce((map, stockListItem) => {
            const minStockLevel = utils.exists(stockListItem, "minimumStock") &&
                utils.exists(stockListItem.minimumStock, houseShortLowerCase) ?
                stockListItem.minimumStock[houseShortLowerCase] : 0;
            let data = {
                name: stockListItem.name,
                count: activity.subCategory === "checkout" ? null : 0,
                reserved: 0,
                total: 0,
                minStock: minStockLevel,
            };

            if (minibarCount && utils.exists(minibarCount, stockListItem.name)) {
                const counts = minibarCount[stockListItem.name];
                data = { ...data, ...counts }
            }

            map[stockListItem.name] = data;
            return map;
        }, {});

        const headers = ["name", "count", "reserved"];
        const values = Object.values(stockListItems);

        if (activity.subCategory !== "checkout") {
            headers.push("minimum stock", "total");
        }

        if (activity.subCategory !== "checkin-prep") {
            // Get total provided items up until this current activity
            const totalProvided = await minibarService.getTotalProvided(customer, activity.startingAt, onError);
            headers.push("provided");
            for (let i = 0; i < values.length; i++) {
                const row = values[i];
                values[i].provided = utils.exists(totalProvided, row.name) ? totalProvided[row.name] : 0;
            }
        }

        // If this is a checkout activity, and there's an existing minibar count, we can calculate the minibar sale
        if (activity.subCategory === "checkout" && minibarCount !== null) {
            headers.push("sold");
            for (let i = 0; i < values.length; i++) {
                const row = values[i];
                values[i].sold = row.provided - row.count;
            }
        }

        onDisplayMinibarTable("Minibar Count", activity, headers, stockListItems, onSubmitStockCount);
    }

    const onUploadPhoto = async(fileData) => {
        const photoRecord = await activityService.uploadPhoto(activity, fileData, onError);
        if(photoRecord !== false) {
            setRequiredPhotosUploaded(true);
        }
        return photoRecord
    }

    const handleActivityClick = async () => {
        setLoadingExpandedActivity(true);
        await loadExpandedActivityInfo();
        setLoadingExpandedActivity(false);
    }

    const loadExpandedActivityInfo = async () => {
        if (!activity) return;

        const expand = !expanded;

        if (expand) {
            if (activity.category === "meal") {
                // If this list is displayed for all customers, get the customer for each activity 
                const bookingId = activity.bookingId;
                if(utils.isEmpty(bookingId)) {
                    const mealCustomer = customer ? customer : await getParent(activity);
                    bookingId = utils.isEmpty(mealCustomer) ? "missing" : mealCustomer.id;
                }
               
                const dishes = await mealService.getMealDishes(bookingId, activity.id, {}, onError);
                const dishesPrice = dishes.reduce((sum, dish) => dish.isFree === true ? 0 : sum + dish.customerPrice, 0);
                setDishesPrice(dishesPrice);
                setDishes(dishes);
            }

            // Check if photos already exist, and get their download URLs
            const activityPhotos = await activityService.getPhotos(activity, onError);
            setPhotos(activityPhotos);
        }
        setExpanded(expand);
    };

    useEffect(() => {
        calculateActivityStatus();
        const newAssigneeStyleIndex = getAssigneeStyleIndex();
        setAssigneeStyleIndex(newAssigneeStyleIndex);
    }, [activity, activityInfo, requiredPhotosUploaded, minuteTicker]);

    useEffect(() => {
        // Blinking effect on staff assign component, for when their attention is needed, as they need to re-confirm
        let timerId = null;
        if (!utils.isEmpty(activity.changeDescription)) {
            const toggleColor = () => {
                setAssigneeStyleIndex(prevIndex => prevIndex === 1 ? 2 : 1);
            };

            timerId = setInterval(toggleColor, 500);
        }

        // Increment the ticker state every minute. Activity statuses changes depends on time
        // E.g. only possible to complete activity when it's past its deadline, counted in minutes
        const tick = () => {
            // Incrementing the ticker forces the component (and the other useEffect) to rerun
            setMinuteTicker(prev => prev + 1);
        };

        const intervalId = setInterval(tick, 60000); //60k ms = 1min

        const setInitialData = async () => {
            let activityCustomer = inputCustomer;
            if (!activityCustomer) {
                // This means, this component is used in the activity list for all customers. Thus each activity needs to display customer name
                setShowCustomerInfo(true);
                activityCustomer = await getParent(activity);
            }

            setCustomer(activityCustomer);

            const existingMinibarCount = await minibarService.get(activityCustomer, { "activityId": activity.id }, onError);
            setMinibarCount(existingMinibarCount && existingMinibarCount.length > 0 ? existingMinibarCount[0].items : null);
        }

        const setUserRole = async () => {
            const userRole = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userRole);
        }

        setInitialData();
        setUserRole();
        getAndSetActivityInfo();

        return () => {
            if (timerId) clearInterval(timerId);
            clearInterval(intervalId);
        }
    }, []);

    const showProvider = activity && activity.category !== "meal" && activity.internal !== true && !utils.isEmpty(activity.provider);
    const houseColor = houseShortName === "HH" ? "darkcyan" : "rgb(2, 65, 116)";

    if (!activity) {
        return <p>Loading...</p>;
    }

    const finalAssigneeStyle = assigneeStyles[assigneeStyleIndex];

    return (
        <div>
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
                        status={status.name}
                    />
                </div>)}

                {/* Display alert when something needs to be fixed urgently  */}
                {alert && (<div className="activity-header-status">
                    <AlertCircle
                        status={alert.category}
                    />
                </div>)}

                {/* Grey out the activity header to show it's completed */}
                {activity && ActivityStatus.Completed.equals(status) && utils.isToday(activity.startingAt) && (
                    <div className="activity-completed-overlay" />
                )}

                {/* Red out the activity header to show it's OVERDUE to be started/completed */}
                {alert && alert.category === activityService.Alert.OVERDUE && (
                    <motion.div
                        className="activity-delayed-overlay"
                        animate={{ scale: [1, 1, 1], opacity: [0.5, 0.1, 0.5] }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                    />
                )}

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
                            <span className="detail-label">Comments: </span>
                            {activity.comments}
                        </p>
                    )}

                    {/* Check In activities might have special requests, customer info and promos copied from the booking object */}
                    {activity.specialRequests && (
                        <p className="preserve-whitespaces">
                            <span className="detail-label">Special Requests: </span>
                            <span className="important-badge">{activity.specialRequests}</span>
                        </p>
                    )}

                    {/* Check In activities might have special requests, customer info and promos copied from the booking object */}
                    {activity.promotions && (
                        <p className="preserve-whitespaces">
                            <span className="detail-label">Promotions: </span>
                            <span className="important-badge">{activity.promotions}</span>
                        </p>
                    )}

                    {/* Check In activities might have special requests, customer info and promos copied from the booking object */}
                    {activity.customerInfo && (
                        <p className="preserve-whitespaces">
                            <span className="detail-label">Customer Info: </span>
                            {activity.customerInfo}
                        </p>
                    )}

                    {/* Check In activities might have special requests, customer info and promos copied from the booking object */}
                    {activity.arrivalInfo && (
                        <p className="preserve-whitespaces">
                            <span className="detail-label">Arrival Info: </span>
                            {activity.arrivalInfo}
                        </p>
                    )}

                    <p><span className="detail-label">Status: </span> {utils.capitalizeWords(status.message)}</p>

                    {showProvider && (<>
                        <p><span className="detail-label">Provider: </span> {activity.provider}</p>
                        {isManagerOrAdmin && (<p><span className="detail-label">Provider Price:</span> {utils.formatDisplayPrice(activity.providerPrice)}</p>)}
                    </>)}

                    {activity.isFree !== true && (<>
                        {activity.customerPrice !== 0 && (<p>
                            <span className="detail-label">Customer Price: </span>
                            {utils.formatDisplayPrice(activity.customerPrice, true) ?? 0}
                        </p>
                        )}

                        {dishesPrice && dishesPrice > 0 && (
                            <p>
                                <span className="detail-label">Dishes Total: </span>
                                {utils.formatDisplayPrice(dishesPrice, true) ?? 0}
                            </p>
                        )}
                    </>)}

                    {/* List dishes if the activity expanded is a meal */}
                    {activity.category === "meal" && (
                        <DishesSummaryComponent dishes={dishes} />
                    )}

                    {!utils.isEmpty(activity.changeDescription) && (
                        <div style={{ color: "red" }}>
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
                                    if (!utils.isEmpty(dishes)) {
                                        activity.dishes = dishes;
                                    }
                                    onNavigate("edit-customer-purchase", {
                                        customer: customer,
                                        activityToEdit: activity,
                                    });
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

                        {user && user.shortName === assignedUserShortName && !activity.assigneeAccept && (<>
                            {(utils.isTomorrow(activity.startingAt) || utils.isToday(activity.startingAt)) ? (

                                <div className="activity-component-footer-icon">
                                    <motion.div
                                        animate={requiredPhotosUploaded ? {} : { scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
                                        transition={requiredPhotosUploaded ? {} : { duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                                    >
                                        <ThumbsUp
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAssigneeStatusChange(true);
                                            }}
                                        />
                                    </motion.div>
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

                        {user && user.shortName === assignedUserShortName &&
                            activity.assigneeAccept &&
                            ActivityStatus.Started.equals(activity.status) === false &&
                            (!utils.isPast(activity.startingAt)) && (

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
                        {canStartActivity() && (
                            <div className="activity-component-footer-icon">
                                <StatusCircle
                                    status={ActivityStatus.Started.name}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetActivityStatusManually(ActivityStatus.Started);
                                    }}
                                />
                                <p>Start it</p>
                            </div>
                        )}

                        {/* Todo (dev-100): for this, we have to fetch the dishes, which we normally don't do until the activity details component is expanded */}
                        {/* Mark activity started */}
                        {canCompleteActivity() && (
                            <div className="activity-component-footer-icon">
                                <StatusCircle
                                    status={ActivityStatus.Completed.name}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetActivityStatusManually(ActivityStatus.Completed);
                                    }}
                                />
                                <p>Complete it</p>
                            </div>
                        )}

                        {/* Can see minibar count always, but only edit if date is today, and it's not completed (see in MinibarTableContext) */}
                        {activity && ActivityStatus.Started.lesserThanOrEqual(activity.status) && activity.subCategory === "checkin-prep" && (
                            <div className="activity-component-footer-icon">
                                <motion.div
                                    animate={minibarCountAnimation}
                                    transition={minibarCountTransition}
                                >
                                    <Candy
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDisplayMinibarCount();
                                        }}
                                    />
                                </motion.div>
                                <p>Count Minibar</p>
                            </div>
                        )}

                        {/* Can see minibar count always, but only edit if date is today, and it's not completed (see in MinibarTableContext) */}
                        {activity && ActivityStatus.Started.lesserThanOrEqual(activity.status) && activity.subCategory === "checkout" && (
                            <div className="activity-component-footer-icon">
                                <motion.div
                                    animate={minibarCountAnimation}
                                    transition={minibarCountTransition}
                                >
                                    <Candy
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDisplayMinibarCount();
                                        }}
                                    />
                                </motion.div>
                                <p>Count Minibar</p>
                            </div>
                        )}

                        {canAddPhotos() && (
                            <PhotoUploadButton 
                                instructions={activityInfo.photoInstructions} 
                                photos={photos}
                                onUpload={onUploadPhoto}
                                path={activityService.getActivityPhotoFilePath(activity)}
                                isRequired={true}
                            /> 
                        )}


                        {activity && ActivityStatus.Started.lesserThanOrEqual(activity.status) && activity.subCategory === "housekeeping" && (
                            <div className="activity-component-footer-icon">
                                <motion.div
                                    animate={minibarCountAnimation}
                                    transition={minibarCountTransition}
                                >
                                    <Candy
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDisplayMinibarCount();
                                        }}
                                    />
                                </motion.div>
                                <p>Minibar Refill</p>
                            </div>
                        )}
                    </div>
                    <MetaInfo document={activity} />
                </div>
            ) : (
                <></>
            )}
        </div>
    );
};
