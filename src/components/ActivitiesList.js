import React, { useState, useEffect, useRef } from 'react';
import * as utils from "../utils.js";
import ActivitiesByDate from './ActivitiesByDate.js';

export default function ActivitiesList({ context, from, to, customer, includeTodos }) {
    const todaysHeader = useRef(null);
    const dateRange = utils.getDateRange(from, to);

    useEffect(() => {
        if (todaysHeader.current) {
            todaysHeader.current.scrollIntoView({ behavior: "instant" });
        }
    }, []);

    return (
        <div className="card-content">
            {dateRange.map(date => {
                return (
                    <div
                        key={`activities-${date}`}
                        ref={utils.isToday(date) ? todaysHeader : null}
                    >
                        <ActivitiesByDate
                            context={context}
                            customer={customer}
                            date={date}
                            includeTodos={includeTodos}
                        />
                    </div>
                );
            })}
        </div>
    );
};
