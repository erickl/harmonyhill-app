import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart } from 'lucide-react';
import * as activityService from '../services/activityService.js'; 
import * as mealService from '../services/mealService.js'; 
import * as invoiceService from '../services/invoiceService.js'; 
import * as utils from "../utils.js";
import AddPurchaseScreen from './AddPurchaseScreen.js';
import EditPurchaseScreen from './EditPurchaseScreen.js';
import './CustomerPurchasesScreen.css'; 

const CustomerPurchasesScreen = ({ customer, onClose, onNavigate }) => {
    const [customerActivities, setCustomerActivities] = useState([]);
    const [runningTotal, setRunningTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedActivity, setSelectedActivity] = useState(null); // State to store the selected customer
    const [activityToEdit, setActivityToEdit] = useState(null); // state to enable editing of activities
    const [customerPurchasing, setCustomerPurchasing] = useState(null); // state to enable adding purchases
    const [expanded, setExpanded] = useState({}); // All dates expanded to boot (all activity headers visible)

    const handleSetExpanded = (date) => {
        const updatedExpandedList = { ...(expanded || {}) }; // Make shallow copy
        updatedExpandedList[date] = updatedExpandedList[date] === true ? false : true;
        setExpanded(updatedExpandedList);
    };

    const fetchPurchases = async () => {
        if(!customer) {
            return;
        }
        try {
            const customerActivities = await activityService.get(customer.id);
            setCustomerActivities(customerActivities);
            
            const invoice = await invoiceService.getTotal(customer.id);
            setRunningTotal(invoice.total);

            // Open today's activities by default
            const today_ddMMM = utils.to_ddMMM(utils.today());
            handleSetExpanded(today_ddMMM);

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

    const handleActivityClick = async (activity) => {
        // If clicking on the same activity, depress it again
        if(selectedActivity?.id === activity?.id) {
            setSelectedActivity(null);
        } else {   
            if(activity.category === "meal") {
                const dishes = await mealService.getMealItems(customer.id, activity?.id);
                activity.dishes = dishes;
            }
            setSelectedActivity(activity);
        }
    };

    const handleEditActivity = (activity) => {
        setActivityToEdit(activity); 
    };

    const handleAddPurchase = (customer) => {
        setCustomerPurchasing(customer); // Indicate we need to switch to add purchase screen
    };

    // Function to render previous / current /  future customer list section
    const renderActivitiesListSection = (allActivities) => {
        if(allActivities.length === 0) {
            return (<div> <h2>No activities yet</h2></div>);
        }
        
        const activitiesByDate = allActivities.reduce((m, activity) => {
            const date = activity.startingAt_ddMMM ? activity.startingAt_ddMMM : "Date TBD";
            if(!m[date]) m[date] = [];
            m[date].push(activity);
            return m;
        }, {});
        
        return (<div>
            {Object.entries(activitiesByDate).map(([date, activities]) => (
                <React.Fragment key={`activities-${date}`}>
                    <div>
                        <h3
                            className={'customer-group-header clickable-header'}
                            onClick={() => handleSetExpanded(date) }>
                            
                            {date}
                            
                            <span className="expand-icon">
                                {expanded[date] ? ' ▼' : ' ▶'} {/* Added expand/collapse icon */}
                            </span>
                            
                        </h3>
                        {expanded[date] ? (
                            <div>
                                {activities.map((activity) => (
                                    <React.Fragment key={activity.id}>
                                        <div
                                            className={`customer-list-item clickable-item ${utils.getHouseColor(activity.house)}`} 
                                            onClick={() => handleActivityClick(activity)}
                                        >
                                            <div className="customer-name-in-list">
                                                <span>{`${activity.category}`}</span>
                                                <span>{activity.startingAt_HHmm}</span>
                                            </div>
                                            {activity.subCategory}
                                        </div>
                                        {selectedActivity?.id === activity.id && (
                                        
                                            <div className="customer-details">
                                                {activity.category !== "meal" && (<p><span className="detail-label">Assigned To:</span> {activity.assignedTo}</p>)}
                                                <p><span className="detail-label">Created By:</span> {activity.createdBy}</p>
                                                <p><span className="detail-label">Created At:</span> {activity.createdAt_ddMMM_HHmm}</p>
                                                {activity.dietaryRestrictions && (<p><span className="detail-label">Dietary restrictions: </span><span className="dietaryRestrictions">{activity.dietaryRestrictions}</span></p>)}
                                                {activity.comments && (<p><span className="detail-label">Comments:</span> {activity.comments}</p>)}
                                                <p><span className="detail-label">Status:</span> {activity.status}</p>
                                                <p><span className="detail-label">Provider:</span> {activity.provider}</p>
                                                <p><span className="detail-label">Assigned To:</span> {activity.assignedTo}</p>
                                                <p><span className="detail-label">Price:</span> {activity.customerPrice}</p>

                                                {/* List dishes if the activity expanded is a meal */}
                                                {activity.dishes && (
                                                    Object.values(activity.dishes).map((dish) => (
                                                        <React.Fragment key={`${activity.id}-${dish.id}`}>
                                                            <p>{invoiceService.dishReceiptLine(dish)}</p>
                                                        </React.Fragment>
                                                    ))
                                                )}
                                                
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

    if(activityToEdit) {
        return (
            <EditPurchaseScreen
                customer={customer}
                activityToEdit={activityToEdit}
                onClose={() => {
                    setActivityToEdit(null);
                    fetchPurchases();
                }}
                onNavigate={onNavigate}
            ></EditPurchaseScreen>
        );
    }

    if (customerPurchasing) {
        return (
            <AddPurchaseScreen
                customer={customerPurchasing}
                onClose={() => {     
                    setCustomerPurchasing(null);
                    fetchPurchases();
                }}
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h2 className="card-title"> 
                        Activities<br/>{customer.name}
                    </h2>
                    <p>{customer.checkInAt_wwwddMMM} - {customer.checkOutAt_wwwddMMM}</p>
                </div>
                <div>   
                    <button 
                        className="add-button"  
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddPurchase(customer);
                        }}>
                        +
                    </button> 
                    <p>Total: {runningTotal} Rp</p>   
                </div>
            </div>
            
            <div className="card-content">
                {/* Activities */}
                {renderActivitiesListSection(customerActivities)}   
            </div>
            <button type="button" onClick={() => onClose() } className="cancel-button">
                Back to customers
            </button>
        </div>
    );
};

export default CustomerPurchasesScreen;
