import React, { useState, useEffect } from 'react';
import "./ActivitiesScreen.css";
import ActivitiesList from './ActivitiesList.js';

export default  function ActivitiesScreen({onNavigate}) { 
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Activities</h2>
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
