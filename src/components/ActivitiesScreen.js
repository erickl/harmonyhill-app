import {useState} from 'react';
import "./ActivitiesScreen.css";
import ActivitiesAllLists from './ActivitiesAllLists.js';
import SheetUploader from './SheetUploader.js';
import * as activityService from "../services/activityService.js";
import * as mealService from "../services/mealService.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useNotification } from "../context/NotificationContext.js";
import Switch from 'react-switch';

/**
 * @param {*} param0 
 * @returns component for the activities of all customers
 */
export default  function ActivitiesScreen({context}) { 
    const [includeTodos, setIncludeTodos] = useState(false);
    const { onError } = useNotification();
    const { permissions } = useUserPermissions();

    const filterHeaders = {
        "after"  : "date",
        "before" : "date",
    };

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
                    <div className='card-header-title'>
                        <h2 className="activities-card-title">Activities</h2> 
                        <label className='todo-switch'>
                            <Switch
                                width={35}
                                height={20}
                                handleDiameter={14}
                                onChange={() => setIncludeTodos(prev => !prev)} 
                                checked={includeTodos} 
                            />
                            <span>Show todos</span>
                        </label>
                    </div>
                </div>

                <div className="card-header-right">
                    {permissions.isAdmin && (<div style={{display: "flex", }}>
                        <SheetUploader label={"Activities"} onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>
                        <SheetUploader label={"Dishes"} onExportRequest={getMealDataForExport} filterHeaders={filterHeaders}/>
                    </div>)}
                </div>
            </div> 

            <ActivitiesAllLists 
                context={context} 
                customer={null} 
                includeTodos={includeTodos}
            />   
        </div>
    );
};
