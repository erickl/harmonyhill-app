import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import * as utils from "../utils.js";
import * as mealService from "../services/mealService.js";
import "./ActivityComponent.css";
import Spinner from './Spinner.js';
import {getParent} from "../daos/dao.js";
import * as userService from "../services/userService.js";
import { Pencil, ShoppingCart, Trash2 } from 'lucide-react';
import DishesSummaryComponent from './DishesSummaryComponent.js';

const ActivityComponent = ({ showCustomer, activity, handleEditActivity, handleDeleteActivity, users }) => {
    const [customer,         setCustomer        ] = useState(null);
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [loadingExpandedActivity, setLoadingExpandedActivity] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [dishes, setDishes] = useState([]);

    const handleActivityClick = async (activity) => {
        setLoadingExpandedActivity(true);
        await loadActivityInfo(activity);
        setLoadingExpandedActivity(false);
    }

    const loadActivityInfo = async () => {
        if(!activity) return;

        const expand = !expanded;

        if(expand) {
            if(activity.category === "meal") {
                // If this list is displayed for all customers, get the customer for each activity 
                const mealCustomer = customer ? customer : await getParent(activity);
                const dishes = await mealService.getDishes(mealCustomer.id, activity.id);
                setDishes(dishes);
            }
        }
        setExpanded(expand);
    };

    useEffect(() => {
        const getCustomer = async() => {
            const customer = await getParent(activity);
            setCustomer(customer);
        }

        if(showCustomer) {
            getCustomer();
        }

        const setUserRole = async() => {
            const userRole = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userRole);
        }

        setUserRole();
    }, []);

    const showProvider = activity && activity.category !== "meal" && activity.internal !== true && !utils.isEmpty(activity.provider);

    
    const assignedUser = users ? users.find(user => user.name === activity.assignedTo) : null;
    const assignedUserShortName = assignedUser ? assignedUser.shortName : "?";
    const assignedUserColor = assignedUserShortName === "?" ? "red" : "green";

    const houseShortName = activity.house === "harmony hill" ? "HH" : "JN";
    const houseColor = houseShortName === "HH" ? "darkcyan" : "rgb(2, 65, 116)";


    return (<>
        <div className="activity-header" onClick={() => handleActivityClick(activity)}>
            <div className="activity-header-left">
                <div className="activity-header-house" style={{ backgroundColor: houseColor }}>
                    {houseShortName}
                </div>
                <div className="activity-header-assignee" style={{ backgroundColor: assignedUserColor }}>
                    {assignedUserShortName}
                </div>
            </div>
            <div className="activity-header-time">
                {activity.startingAt_HHmm}
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
            {activity.comments && (<p><span className="detail-label">Comments:</span> {activity.comments}</p>)}
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

            <div className="activity-component-footer">
                <div className="activity-component-footer-icon">
                    <Pencil   
                        onClick={(e) => {
                            e.stopPropagation();
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
                                handleDeleteActivity(activity);
                            }}
                        />
                        <p>Delete</p>
                    </div>
                )}
            </div>   
        </div>
        ) : ( <></>)}
    </>);
};

export default ActivityComponent;
