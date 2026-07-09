import React, { useState, useEffect, useRef } from 'react';
import * as utils from "../utils.js";
import "./ActivitiesList.css";
import ActivitiesByDay from './ActivitiesByDay.js';

export default function ActivitiesList({context, from, to, customer, expandAllDates}) {
    const todaysHeader = useRef(null);

    const from_ = from ? from : (customer ? customer.checkInAt : null);
    const to_ = to ? to : (customer ? customer.checkOutAt : null);
    const dateRange = utils.getDateRange(from_, to_);

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
                        <ActivitiesByDay 
                            context={context}
                            customer={customer}
                            date={date}
                        />
                    </div>
                );
            })}
        </div>
    );
};
