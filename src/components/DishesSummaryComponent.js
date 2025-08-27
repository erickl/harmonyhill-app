import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import { groupByCourse } from '../services/mealService.js';
import * as invoiceService from "../services/invoiceService.js";
import "./DishesSummaryComponent.css";

export default function DishesSummaryComponent({dishes}) {

    if(utils.isEmpty(dishes)) {
       return (
            <p>No dishes ordered yet</p> 
       );
    }
    
    // Group by e.g. mains, starters, drinks, etc...
    const groupedByCourse = groupByCourse(dishes);

    // Sort appearance of meals by meal categories, i.e. first starters, then mains, lastly coffee, etc..
    const groupedByCourseSorted = Object.keys(groupedByCourse).sort((a, b) => a.localeCompare(b));

    return (
        <div className="dishes-summary">
            <p><b>Dishes</b></p>
            <div className="courses-summary">
                {groupedByCourseSorted.map((priorityAndCourse) => {
                    const dishes = groupedByCourse[priorityAndCourse];
                    const [priority, course] = priorityAndCourse.split(",");
                    return(
                        <div>
                            <p className="course-summary-header">
                                <b>{utils.capitalizeWords(course)}</b>
                            </p>
                            {dishes.filter((dish) => dish.quantity > 0).map((dish) => (
                                <React.Fragment key={`summary-${dish.id}`}>
                                    <p className="dish-receipt-line">• {invoiceService.dishReceiptLine(dish)}</p>
                                </React.Fragment>
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
