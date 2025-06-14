import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart } from 'lucide-react';
import * as activityService from '../services/activityService.js'; 
import * as utils from "../utils.js";
import AddPurchaseScreen from './AddPurchaseScreen.js';
import './CustomerPurchasesScreen.css'; 

const CustomerPurchasesScreen = ({ customer, onClose, onNavigate }) => {
    const [customerActivities, setCustomerActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedActivity, setSelectedActivity] = useState(null); // State to store the selected customer
    const [customerToEdit, setCustomerToEdit] = useState(null); // state to enable editing of customers
    const [customerPurchasing, setCustomerPurchasing] = useState(null); // state to enable adding purchases
    const [expanded, setExpanded] = useState(true); // All dates expanded to boot (all activity headers visible)

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

    const handleActivityClick = (activity) => {
        // If clicking on the same activity, depress it again
        if(selectedActivity?.id === activity?.id) {
            setSelectedActivity(null);
        } else {
            setSelectedActivity(activity);
        }
    };

    const handleEditActivity = (customer) => {
        setCustomerToEdit(customer); // Set the customer to be edited
    };

    const handleAddPurchase = (customer) => {
        setCustomerPurchasing(customer); // Indicate we need to switch to add purchase screen
    };

    // Function to render previous / current /  future customer list section
    const renderActivitiesListSection = (title, allActivities, date, isExpanded, setIsExpanded) => {
        if(allActivities.length === 0) {
            return (<div> <h2>No activities yet</h2></div>);
        }
        const activitiesByDate = allActivities.reduce((m, activity) => {
            if(!m[activity.startingAt_ddMMM]) {
                m[activity.startingAt_ddMMM] = [];
            }
            m[activity.startingAt_ddMMM].push(activity);
            return m;
        }, {});
        return (<div>
            {Object.entries(activitiesByDate).map(([date, activities]) => (
                <React.Fragment key={`activities-${date}`}>
                    <div>
                        <h3
                            className={'customer-group-header clickable-header'}
                            onClick={() => setIsExpanded(!isExpanded)}>
                            
                            {date}
                            
                            <span className="expand-icon">
                                {isExpanded ? ' ▼' : ' ▶'} {/* Added expand/collapse icon */}
                            </span>
                            
                        </h3>
                        {isExpanded ? (
                            <div>
                                {activities.map((activity) => (
                                    <React.Fragment key={activity.id}>
                                        <div
                                            className={`customer-list-item clickable-item ${utils.getHouseColor(activity.house)}`} 
                                            onClick={() => handleActivityClick(activity)}
                                        >
                                            <div className="customer-name-in-list">
                                                <span>{`${activity.category}`}</span>
                                                <span> {activity.startingAt_HHmm}</span>
                                            </div>
                                            {activity.subCategory}
                                        </div>
                                        {selectedActivity && activity.id && (
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
                </React.Fragment>
            ))}
        </div>);
    };

    if (customerPurchasing) {
        return (
            <AddPurchaseScreen
                customer={customerPurchasing}
                onClose={() => setCustomerPurchasing(null)}
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title"> 
                    Activities<br/>{customer.name}
                </h2>
                <button 
                    className="add-button"  
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddPurchase(customer);
                    }}>
                    +
                </button>
                
            </div>
            <div className="card-content">
                {/* Activities */}
                {renderActivitiesListSection("Activities", customerActivities, "date", expanded, setExpanded)}   
            </div>
        </div>
    );
};

export default CustomerPurchasesScreen;
