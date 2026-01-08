import { useState, useEffect } from 'react';
import "./ActivitiesScreen.css";
import ActivitiesAllLists from './ActivitiesAllLists.js';
import SheetUploader from './SheetUploader.js';
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import * as userService from "../services/userService.js";
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useNotification } from "../context/NotificationContext.js";

export default  function ActivitiesScreen({onNavigate, onClose}) { 
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
    }, []);

    const getDataForExport = async(filterValues, onProgress) => {
        const rows = await activityService.toArrays(filterValues, onProgress, onError);
        return rows;
    }

    const getMealDataForExport = async(filterValues, onProgress) => {
        const rows = await mealService.toArrays(filterValues, onProgress, onError);
        return rows;
    }

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <h2 className="card-title">Activities</h2>    
                </div>

                <div className="card-header-right">
                    {isAdmin && (<div style={{display: "flex", }}>
                        <SheetUploader label={"Activities"} onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>
                        <SheetUploader label={"Dishes"} onExportRequest={getMealDataForExport} filterHeaders={filterHeaders}/>
                    </div>)}
                </div>
            </div> 
            <ActivitiesAllLists onNavigate={onNavigate} onClose={onClose} futureExpanded={true} />   
        </div>
    );
};
