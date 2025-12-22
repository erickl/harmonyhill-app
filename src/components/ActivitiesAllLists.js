import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import "./ActivitiesList.css";
import ActivitiesList from './ActivitiesList.js';
import * as userService from "../services/userService.js";

export default function ActivitiesAllLists({onNavigate, futureExpanded}) {
    const [interval, setInterval] = useState(null);
    const [expandPrevious, setExpandPrevious] = useState(false);
    const [expandFuture, setExpandFuture] = useState(futureExpanded || false);

    useEffect(() => {
        const getUserPermissions = async() => {
            const userCanSeeAllBookings = await userService.canSeeAllBookings();
            const after = userCanSeeAllBookings  ? utils.now(-7) : utils.now(-2);
            const before = userCanSeeAllBookings ? utils.now(30) : utils.now(7);
            setInterval({from : after, to : before});
        }
        getUserPermissions();
    }, []);

    return (
        <div className="card-content"> 
            <h3
                style={{marginBottom:"0px"}}
                className={'customer-group-header clickable-header'}
                onClick={ () => setExpandPrevious(!expandPrevious) }
            >
                Previous
                
                <span className="expand-icon">
                    {expandPrevious ? ' ▼' : ' ▶'}
                </span>
            </h3>

            {/* Past activities */}
            {interval && expandPrevious && (
                <ActivitiesList
                    onNavigate={onNavigate}
                    from={interval.from}
                    to={utils.today(-1).endOf('day')}
                    customer={null}
                    expandAllDates={true}
                />
            )}

            {/* Future activities */}
            <h3
                style={{marginBottom:"0px"}}
                className={'customer-group-header clickable-header'}
            >
                Today
            </h3>

            {/* Today's activities */}
            <ActivitiesList
                onNavigate={onNavigate}
                from={utils.today()}
                to={utils.today().endOf('day')}
                customer={null} 
                expandAllDates={true}
            />

            {/* Future activities */}
            <h3
                style={{marginBottom:"0px"}}
                className={'customer-group-header clickable-header'}
                onClick={ () => setExpandFuture(!expandFuture) }
            >
                Future
                
                <span className="expand-icon">
                    {expandFuture ? ' ▼' : ' ▶'}
                </span>
            </h3>

            {interval && expandFuture && (
                <ActivitiesList
                    onNavigate={onNavigate}
                    from={utils.today(1)}
                    to={interval.to.endOf('day')}
                    customer={null}
                    expandAllDates={true}
                />
            )}
        </div>
    );
}
