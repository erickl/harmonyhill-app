import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart } from 'lucide-react';
import * as activityService from '../services/activityService.js'; 
import * as utils from "../utils.js";
import './CustomerPurchasesScreen.css'; 

const CustomerPurchasesScreen = ({ customer, onClose, onNavigate }) => {
    const [customerActivities, setCustomerActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCustomer, setSelectedCustomer] = useState(null); // State to store the selected customer
    const [customerToEdit, setCustomerToEdit] = useState(null); // state to enable editing of customers
    const [customerPurchasing, setCustomerPurchasing] = useState(null); // state to enable adding purchases
    const [expanded, setExpanded] = useState(false); // State to expand past customer section

    const fetchPurchases = async () => {
        if(!customer) {
            return;
        }
        try {
            const today = utils.today();
            //const customerActivities = await activityService.getAll({after: today});
            const customerActivities = await activityService.get(customer.id);//, {after: today});
            setCustomerActivities(customerActivities);
            setLoading(false);
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Loading Customers...</h2>
                </div>
                <div className="card-content">
                    <p>Loading customer data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Error</h2>
                </div>
                <div className="card-content">
                    <p>Error: {error.message}</p>
                </div>
            </div>
        );
    }

    const handleCustomerClick = (customer) => {
        setSelectedCustomer(customer);
    };

    const handleEditActivity = (customer) => {
        setCustomerToEdit(customer); // Set the customer to be edited
    };

    const handleAddPurchase = (customer) => {
        setCustomerPurchasing(customer); // Indicate we need to switch to add purchase screen
    };

    // Function to render previous / current /  future customer list section
    const renderActivitiesListSection = (title, activities, date, isExpanded, setIsExpanded) => {
        const hasActivities = activities.length > 0;
        return (
            <div>
                <h3
                    className={`customer-group-header ${hasActivities ? 'clickable-header' : ''}`}
                    onClick={() => hasActivities && setIsExpanded(!isExpanded)} //if it has customers inside, toggle the visibility
                >
                    {title}
                    {hasActivities && (
                        <span className="expand-icon">
                            {isExpanded ? ' ▼' : ' ▶'} {/* Added expand/collapse icon */}
                        </span>
                    )}
                </h3>
                {isExpanded && hasActivities ? (
                    <div>
                        {activities.map((activity) => (
                            <React.Fragment key={activity.id}>
                                <div
                                    className={`customer-list-item clickable-item ${utils.getHouseColor(activity.house)}`} // house color calculated
                                    onClick={() => handleCustomerClick(activity)}
                                >
                                    <div className="customer-name-in-list">
                                        <span>{`${activity.category}`}</span>
                                        {<ShoppingCart
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddPurchase(activity);
                                            }}
                                        />}
                                    </div>
                                    {activity.subCategory}
                                </div>
                                {activity.id && ( // todo: not sure what condition this should be?
                                    <div className="customer-details">
                                        <p><span className="detail-label">Villa:</span> {activity.house}</p>
                                        <p><span className="detail-label">Starting At:</span> {activity.startingAt_ddMMM_HHmm}</p>
                                        <p><span className="detail-label">Assigned To:</span> {activity.assignedTo}</p>
                                        <p><span className="detail-label">Created By:</span> {activity.createdBy}</p>
                                        <p><span className="detail-label">Created At:</span> {activity.createdAt_ddMMM_HHmm}</p>
                                        <p><span className="detail-label">Allergies: </span><span className="allergies">{activity.allergies}</span></p>
                                        <p><span className="detail-label">Details:</span> {activity.details}</p>
                                        <p><span className="detail-label">Status:</span> {activity.status}</p>
                                        <p><span className="detail-label">Provider:</span> {activity.provider}</p>
                                        <p><span className="detail-label">Price:</span> {activity.price}</p>
                                        
                                        <button
                                            className="edit-booking"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditActivity(activity);
                                            }}> Edit Activity
                                        </button>
                                    </div>

                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    null
                )}
            </div>
        );
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title"> {customer.name}
                    <button className="add-customer-button" onClick={() => onNavigate('add-customer')}>
                        +
                    </button></h2>
            </div>
            <div className="card-content">
                {/* Activities */}
                {renderActivitiesListSection("Activities", customerActivities, "date", expanded, setExpanded)}   
            </div>
        </div>
    );

};

export default CustomerPurchasesScreen;
