import React, { useState, useEffect } from 'react';
import "./ActivitiesScreen.css";
import ActivitiesList from './ActivitiesList.js';
import SheetUploader from './SheetUploader.js';
import * as activityService from "../services/activityService.js";
import * as userService from "../services/userService.js";
import { useNotification } from "../context/NotificationContext.js";

export default  function ActivitiesScreen({onNavigate}) { 
    const [isAdmin, setIsAdmin] = useState(false);
    const { onError } = useNotification();

    const filterHeaders = {
        "after"  : "date",
        "before" : "date",
    };

    useEffect(() => {
        const getUserPermissions = async() => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);
        }
        getUserPermissions();
    });


    const getDataForExport = async(filterValues) => {
        const rows = await activityService.toArrays(filterValues, onError);
        return rows;
    }

    return (
        <div className="fullscreen">
            <div className="card-header">
                <h2 className="card-title">Activities</h2>

                <div className="card-header-right">
                    {isAdmin && (<SheetUploader onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>)}
                </div>
            </div> 
            
            { /* customer = null, because this is for all customers */ }
            <ActivitiesList
                onNavigate={onNavigate}
                customer={null} 
                expandAllDates={true}
            />
        </div>
    );
};
