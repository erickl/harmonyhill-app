import React, { useState, useEffect } from 'react';
import * as utils from '../utils.js';
import ErrorNoticeModal from './ErrorNoticeModal.js';
import * as activityService from "../services/activityService.js";
import "./ActivitiesScreen.css";
import ActivitiesList from './ActivitiesList.js';
import EditPurchaseScreen from './EditPurchaseScreen.js';
import {getParent} from "../daos/dao.js";

const ActivitiesScreen = ({onNavigate}) => {
    
    const [activities, setActivities] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activityToEdit, setActivityToEdit] = useState(null);
    const [customer, setCustomer] = useState(null);
            
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const handleEditActivity = async(activity) => {
        if(activity) {
            const customer = await getParent(activity);
            setCustomer(customer);
            setActivityToEdit(activity); 
        }
    }

    const getAllActivities = async () => {
        try {
            const after = utils.now(-7);
            const before = utils.now(30);
            const filter = {"after" : after, "before" : before};
            const allActivities = await activityService.getAll(filter);
            setActivities(allActivities);
        } catch(e) {
            onError(`Error fetching activities: ${e.message}`);
        }
        setLoading(false);
    }

    useEffect(() => {
        getAllActivities();
    }, [activities]);

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

    if(activityToEdit && customer) {
        return (
            <EditPurchaseScreen
                customer={customer}
                activityToEdit={activityToEdit}
                onClose={() => {
                    setActivityToEdit(null);
                    setCustomer(null);
                    getAllActivities();
                }}
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Activities</h2>
            </div>
            
            { /* customer = null, because this is for all customers */ }
            <ActivitiesList
                customer={null} 
                activities={activities}
                handleEditActivity={handleEditActivity}
                expandAllDates={true}
            />

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
};

export default ActivitiesScreen;
