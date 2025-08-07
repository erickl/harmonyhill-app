import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import * as utils from "../utils.js";
import "./ActivityComponent.css";
import {getParent} from "../daos/dao.js";
import * as userService from "../services/userService.js";

const ActivityComponent = ({ displayCustomer, activity, handleEditActivity }) => {
    const [customer,         setCustomer        ] = useState(null );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);

    useEffect(() => {
        const getCustomer = async() => {
            const customer = await getParent(activity);
            setCustomer(customer);
        }

        if(displayCustomer) {
            getCustomer();
        }

        const setUserRole = async() => {
            const userRole = await userService.isManagerOrAdmin();
            setUserRole(userRole);
        }

        setUserRole();
    }, []);

    const showProvider = activity.category !== "meal" && activity.internal !== true && !utils.isEmpty(activity.provider);

    return (
        <div className="customer-details">
            {customer !== null && (<p><span className="detail-label">Customer Name:</span> {customer.name}</p>)}
            {customer !== null && (<p><span className="detail-label">Villa:</span> {utils.capitalizeWords(customer.house)}</p>)}
            {activity.category !== "meal" && (<p><span className="detail-label">Assigned To:</span> {activity.assignedTo}</p>)}
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
            {activity.category === "meal" && (<>
                {!utils.isEmpty(activity.dishes) ? (
                    Object.values(activity.dishes).map((dish) => (
                        <React.Fragment key={`${activity.id}-${dish.id}`}>
                            <p>{invoiceService.dishReceiptLine(dish)}</p>
                        </React.Fragment>
                    ))
                ) : (<p>No dishes ordered yet</p>)}
            </>)}

            <button
                className="edit-booking"
                onClick={(e) => {
                    e.stopPropagation();
                    handleEditActivity(activity);
                }}> Edit Activity
            </button>
        </div>
    );
};

export default ActivityComponent;
