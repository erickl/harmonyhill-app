import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import * as utils from "../utils.js";
import "./ActivityComponent.css";

const ActivityComponent = ({ activity, handleEditActivity }) => {
    return (
        <div className="customer-details">
            {activity.category !== "meal" && (<p><span className="detail-label">Assigned To:</span> {activity.assignedTo}</p>)}
            <p><span className="detail-label">Created By:</span> {activity.createdBy}</p>
            <p><span className="detail-label">Created At:</span> {activity.createdAt_ddMMM_HHmm}</p>
            {activity.dietaryRestrictions && (<p><span className="detail-label">Dietary restrictions: </span><span className="dietaryRestrictions">{activity.dietaryRestrictions}</span></p>)}
            {activity.comments && (<p><span className="detail-label">Comments:</span> {activity.comments}</p>)}
            <p><span className="detail-label">Status:</span> {activity.status}</p>
            <p><span className="detail-label">Provider:</span> {activity.provider}</p>
            <p><span className="detail-label">Assigned To:</span> {activity.assignedTo}</p>
            <p><span className="detail-label">Customer Price:</span> {activity.customerPrice ?? 0 }</p>

            {/* List dishes if the activity expanded is a meal */}
            {!utils.isEmpty(activity.dishes) ?  (
                Object.values(activity.dishes).map((dish) => (
                    <React.Fragment key={`${activity.id}-${dish.id}`}>
                        <p>{invoiceService.dishReceiptLine(dish)}</p>
                    </React.Fragment>
                ))
            ) : (<p>No dishes ordered yet</p>)}
            
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
