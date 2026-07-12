import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import "./ActivitiesAllLists.css";
import ActivitiesList from './ActivitiesList.js';
import ActivitiesByDate from './ActivitiesByDate.js';
import * as userService from "../services/userService.js";
import { useUserPermissions } from '../context/UserPermissionsContext.js';

export default function ActivitiesAllLists({ context, customer }) {
    const [expandPrevious, setExpandPrevious] = useState(false);
    const [expandNextWeek, setExpandNextWeek] = useState(true);
    const [expandFuture, setExpandFuture] = useState(false);

    const { permissions } = useUserPermissions();

    let from = null;
    let to = null;

    // If customer != null, no need for a date range => Need to see all customer's activities
    if (!customer) {
        const userCanSeeAllBookings = permissions.isManagerOrAdmin;

        from = userCanSeeAllBookings ? utils.now(-7) : utils.now(-2);
        from = from.startOf('day');

        to = userCanSeeAllBookings ? utils.now(30) : utils.now(7);
        to = to.endOf('day');
    } else {
        from = customer.checkInAt.startOf('day');
        to = customer.checkOutAt.endOf('day');
    }

    return (
        <div className="card-content">

            {/* Activities without date (i.e unscheduled) */}
            <ActivitiesByDate context={context} customer={customer} date={null} />

            {customer && (
                // Any activities scheduled before checkin
                <ActivitiesByDate
                    context={context}
                    customer={customer}
                    date2={customer.checkInAt.startOf('day')}
                />
            )}

            <h3
                style={{ marginBottom: "0px" }}
                className={'activity-list-group-header clickable-header'}
                onClick={() => setExpandPrevious(prev => !prev)}
            >
                Previous

                <span className="expand-icon">
                    {expandPrevious ? ' ▼' : ' ▶'}
                </span>
            </h3>

            {/* Past activities */}
            {expandPrevious && (
                <ActivitiesList
                    context={context}
                    from={from}
                    to={utils.today(-1).endOf('day')}
                    customer={customer}
                />
            )}

            {/* Today's activities */}
            <ActivitiesList
                context={context}
                from={utils.today()}
                to={utils.today().endOf('day')}
                customer={customer}
            />

            {/* Future activities */}
            <h3
                style={{ marginBottom: "0px" }}
                className={'activity-list-group-header clickable-header'}
                onClick={() => setExpandNextWeek(prev => !prev)}
            >
                Next week

                <span className="expand-icon">
                    {expandNextWeek ? ' ▼' : ' ▶'}
                </span>
            </h3>

            {expandNextWeek && (
                <ActivitiesList
                    context={context}
                    from={utils.today(1)}
                    to={utils.today(7)}
                    customer={customer}
                />
            )}

            {/* Future activities */}
            <h3
                style={{ marginBottom: "0px" }}
                className={'activity-list-group-header clickable-header'}
                onClick={() => setExpandFuture(prev => !prev)}
            >
                Future

                <span className="expand-icon">
                    {expandFuture ? ' ▼' : ' ▶'}
                </span>
            </h3>

            {expandFuture && (
                <ActivitiesList
                    context={context}
                    from={utils.today(1)}
                    to={to}
                    customer={customer}
                />
            )}

            {customer && (
                // Any activities scheduled after checkout 
                <ActivitiesByDate
                    context={context}
                    customer={customer}
                    date1={customer.checkOutAt.endOf('day')}
                />
            )}
        </div>
    );
}
