import React, { useState, useEffect, act } from 'react';
import * as activityService from "../services/activityService.js";
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import * as minibarService from "../services/minibarService.js";
import "./ActivityComponent.css";
import Spinner from './Spinner.js';
import {getParent} from "../daos/dao.js";
import * as userService from "../services/userService.js";
import { Pencil, Trash2, ThumbsUp, ThumbsDown, Candy, Camera, Image } from 'lucide-react';
import DishesSummaryComponent from './DishesSummaryComponent.js';
import StatusCircle from './StatusCircle.js';
import AlertCircle from './AlertCircle.js';
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useItemsCounter } from "../context/ItemsCounterContext.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js';
import { useCameraModal } from '../context/CameraContext.js';
import { useImageCarousel } from '../context/ImageCarouselContext.js';
import MetaInfo from './MetaInfo.js';

import { motion } from "framer-motion";

const assigneeStyles = [
    { backgroundColor: "#E12C2C", color: "white" },
    { backgroundColor: "#FFA500", color: "black" },
    { backgroundColor: "green",     color: "white" }
];  

export default function ActivityComponent({ inputCustomer, inputActivity, handleEditActivity, handleDeleteActivity, users, user, triggerRerender }) {
    const useActivityStartedStatus = true;
    
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
    const [photos,                  setPhotos                 ] = useState([]);   
    const [photoUploading,          setPhotoUploading         ] = useState(false);  
    const [requiredPhotosUploaded,  setRequiredPhotosUploaded ] = useState(false);

    const { onError } = useNotification();
    const { onCountItems } = useItemsCounter();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();
    const { onOpenCamera } = useCameraModal();
    const { onDisplayImages } = useImageCarousel();

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

    const getAndSetActivityInfo = async() => {
        if(!activity) return null;

        let thisActivityInfo = activityInfo;
        if(!thisActivityInfo) {
            thisActivityInfo = await activityService.getActivityMenuItem(activity.category, activity.subCategory, activity.house);
            setActivityInfo(thisActivityInfo);
        }

        return thisActivityInfo;
    };

    const onConfirmPhoto = async (photo) => {
        setPhotoUploading(true);
        const photoRecord = await activityService.uploadPhoto(activity, photo, onError);
        if(photoRecord !== false) {
            let newPhotos = [...photos, photoRecord];
            setPhotos(newPhotos);
            onSuccess();
        }
        setPhotoUploading(false);
    }

    // const onDeletePhoto = async (photo) => {
    //     if(status.category ===)
    // }

    const canStartActivity = () => {
        if(!useActivityStartedStatus) return false;

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

    const canAddPhotos = () => {
        const isCompleted = status && status.category === activityService.Status.COMPLETED;
        if(isCompleted) return false;

        const isStarted = status && status.category === activityService.Status.STARTED;
        if(isStarted) return true;

        const isGoodToGo = status && status.category === activityService.Status.GOOD_TO_GO;
        if(!isGoodToGo) return false;
        
        // If it's already past the 'Started' stage, we can go from 'Good To Go' to 'Completed', if required photos has been uploaded
        const now = utils.now();
        const minutesLeft = activity.startingAt.diff(now, 'minutes').minutes;
        const tooLateToStart = minutesLeft < -60;
        
        return tooLateToStart && isGoodToGo;
    }

    const canCompleteActivity = () => {
        if(!useActivityStartedStatus) return false;

        const isGoodToGo = status && status.category === activityService.Status.GOOD_TO_GO;
        const isStarted = status && status.category === activityService.Status.STARTED;
        const canStillStart = canStartActivity();

        // Cannot Complete 15 minutes before the activity is scheduled to start
        const now = utils.now();
        const minutesLeft = activity.startingAt.diff(now, 'minutes').minutes;
        if(minutesLeft > 15) {
            return false;
        }

        // If photos are required, see that they've been uploaded
        if(isStarted && requiredPhotosUploaded) {
            return true;
        } else if(!isStarted && canStillStart) {
            return false;
        } else if(isGoodToGo && requiredPhotosUploaded) {
            return true;
        }

        return false;
    }

    const calculateActivityStatus = async(newStatus = null) => {
        if(!activity) return;

        let thisActivityInfo = getAndSetActivityInfo();

        if(!newStatus) {
            newStatus = await activityService.getStatus(activity, onError);
        }
        setStatus(newStatus);

        const currentAlert = await activityService.getAlert(activity, newStatus.category, thisActivityInfo, onError);
        setAlert(currentAlert);

        return {activityInfo: thisActivityInfo, status: newStatus, alert: currentAlert};
    }

    const handleSetActivityStatusManually = async (newStatus) => {
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
            if(result !== false) {
                onSuccess();
            }
            return result;
        });
    }

    const handleActivityClick = async () => {
        setLoadingExpandedActivity(true);
        await loadExpandedActivityInfo();
        setLoadingExpandedActivity(false);
    }

    const loadExpandedActivityInfo = async () => {
        if(!activity) return;

        const expand = !expanded;

        if(expand) {
            if(activity.category === "meal") {
                // If this list is displayed for all customers, get the customer for each activity 
                const mealCustomer = customer ? customer : await getParent(activity);
                const dishes = await mealService.getMealDishes(mealCustomer.id, activity.id);
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

        if(activityInfo && photos)  {
            const photosDone = !activityInfo.photosRequired || photos.length > 0;
            setRequiredPhotosUploaded(photosDone);
        }

        const newAssigneeStyleIndex = getAssigneeStyleIndex();
        setAssigneeStyleIndex(newAssigneeStyleIndex);
    }, [activity, activityInfo, photos, minuteTicker]);

    useEffect(() => { 
        // Blinking effect on staff assign component, for when their attention is needed, as they need to re-confirm
        let timerId = null;
        if(!utils.isEmpty(activity.changeDescription)) {
            const toggleColor = () => {    
                setAssigneeStyleIndex(prevIndex => prevIndex === 1 ? 2 : 1);
            };

            timerId = setInterval(toggleColor, 500);
        }

        // Function to increment the ticker state every minute, because activity status changes depends on time
        // E.g. you can only press complete when the activity is past its due date (sometimes counted in minutes)
        const tick = () => {
            // Incrementing the ticker forces the component (and the other useEffect) to rerun
            setMinuteTicker(prev => prev + 1); 
        };

        const intervalId = setInterval(tick, 60000); //60k ms = 1min

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
        getAndSetActivityInfo();

        return () => {
            if(timerId) clearInterval(timerId);
            clearInterval(intervalId);
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
                
                { showProvider && (<>
                    <p><span className="detail-label">Provider: </span> {activity.provider}</p>
                    { isManagerOrAdmin && ( <p><span className="detail-label">Provider Price:</span> {utils.formatDisplayPrice(activity.providerPrice)}</p> )}
                </>)}

                {!activity.isFree && activity.customerPrice !== 0 && (
                    <p>
                        <span className="detail-label">Customer Price: </span> 
                        {utils.formatDisplayPrice(activity.customerPrice, true) ?? 0 }
                    </p>
                )}

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
                    { canStartActivity() && (
                        <div className="activity-component-footer-icon">
                            <StatusCircle 
                                status={activityService.Status.STARTED} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetActivityStatusManually(activityService.status(activityService.Status.STARTED));
                                }}
                            />
                            <p>Start it</p>
                        </div>
                    )}

                    {/* Todo (dev-100): for this, we have to fetch the dishes, which we normally don't do until the activity details component is expanded */}
                    {/* Mark activity started */}
                    { canCompleteActivity() && (
                        <div className="activity-component-footer-icon">
                            <StatusCircle 
                                status={activityService.Status.COMPLETED} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetActivityStatusManually(activityService.status(activityService.Status.COMPLETED));
                                }}
                            />
                            <p>Complete it</p>
                        </div>
                    )}

                    { canAddPhotos() && (
                        <div className="activity-component-footer-icon">
                            
                            <motion.div
                                animate={requiredPhotosUploaded ? {} : { scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
                                transition={requiredPhotosUploaded ? {} : { duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                            >
                                <Camera 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenCamera(true, false, () => onConfirmPhoto);
                                    }}
                                />
                            </motion.div>
                            <p>Take photo</p>
                        </div>
                    )}

                    { !photoUploading && photos.length > 0 && (
                        <div className="activity-component-footer-icon">
                            <Image 
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    onDisplayImages(photos);
                                }}
                            />
                            <p>See photos</p>
                        </div>
                    )}

                    { photoUploading && (
                        <div className="activity-component-footer-icon">
                            <Spinner size={15}/>
                            <p>Uploading...</p>
                        </div>
                    )}

                    {false && /*todo: complete minibar func first*/ activity && activity.subCategory === "housekeeping" && utils.isToday(activity.startingAt) && (
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
