import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart } from 'lucide-react';
import * as activityService from '../services/activityService.js'; 
import * as mealService from '../services/mealService.js'; 
import * as invoiceService from '../services/invoiceService.js'; 
import * as utils from "../utils.js";
import AddPurchaseScreen from './AddPurchaseScreen.js';
import EditPurchaseScreen from './EditPurchaseScreen.js';
import './CustomerPurchasesScreen.css'; 
import ActivitiesList from './ActivitiesList.js';

const CustomerPurchasesScreen = ({ customer, onClose, onNavigate }) => {
    const [customerActivities, setCustomerActivities] = useState([]);
    const [runningTotal, setRunningTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activityToEdit, setActivityToEdit] = useState(null);         // state to enable editing of activities
    const [customerPurchasing, setCustomerPurchasing] = useState(null); // state to enable adding purchases
    const [expanded, setExpanded] = useState({});                       // All dates expanded to boot (all activity headers visible)

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

            setLoading(false);
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, [customer]);

    const today = utils.today();

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

    const handleEditActivity = (activity) => {
        setActivityToEdit(activity); 
    };

    const handleAddPurchase = (customer) => {
        setCustomerPurchasing(customer); // Indicate we need to switch to add purchase screen
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
                    {customer.checkOutAt >= today &&  (
                        <button 
                            className="add-button"  
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddPurchase(customer);
                            }}>
                            +
                        </button> 
                    )}
                    <p>Total: {runningTotal} Rp</p>   
                </div>
            </div>
            
            <div className="card-content">
                <ActivitiesList
                    customer={customer}
                    activities={customerActivities}
                    handleEditActivity={handleEditActivity}
                />  
            </div>
            <button type="button" onClick={() => onClose() } className="cancel-button">
                Back to customers
            </button>
        </div>
    );
};

export default CustomerPurchasesScreen;
