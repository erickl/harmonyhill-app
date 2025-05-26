import { act } from 'react';
import * as activityDao from '../daos/activityDao.js';
import * as utils from "../utils.js";
import * as userService from "./userService.js";

export async function getSubCategories(category) {
    return await activityDao.getSubCategories(category);
}

/**
 * 
 * @param {*} bookingId 
 * @param {*} filterOptions = {category=transport|yoga|etc.., subCategory=from-airport|to-ubud|etc, after (date), before (date)}
 * @returns activities array, ordered by date (oldest first)
 */
export async function get(bookingId, filterOptions = {}) {
    const activities = await activityDao.getActivities(bookingId, filterOptions);
    activities.map((activity) => {
        if(Object.hasOwn(activity, "date")) {
            activity.date_ddMMM = utils.YYMMdd_to_ddMMM(activity.date);
        }
    });
    return activities; 
}

export async function getOne(bookingId, activityId) {
    return await activityDao.getOne(bookingId, activityId);
}

export async function add(bookingId, activityData) {
    const activity = await mapObject(activityData);
    const activityId = makeId(activity.date, bookingId, activity.subCategory);
    const success = await activityDao.add(bookingId, activityId, activity);
    return success ? activityId : false;
}

export async function assign(bookingId, activityId, personnelName) {
    return await update(bookingId, activityId, { 
        assignedTo: personnelName,
        status: "confirmed"
    });
}

export async function update(bookingId, activityId, activityUpdateData) {
    const activityUpdate = await mapObject(activityUpdateData, true);
    return await activityDao.update(bookingId, activityId, activityUpdate);
}

export async function remove(bookingId, activityId) {
    return await activityDao.remove(bookingId, activityId);
}

export function makeId(date, bookingId, subCategory) {
    return `${date}-${bookingId}-${subCategory.replace(/ /g, '-')}`;
}

async function mapObject(activityData, isUpdate = false) {
    let activity = {};

    if(Object.hasOwn(activityData, "category")) {
        activity.category    = activityData.category;
    }

    if(Object.hasOwn(activityData, "subCategory")) activity.subCategory = activityData.subCategory ;

    if(Object.hasOwn(activityData, "price")) activity.price = activityData.price     ;
    
    if(Object.hasOwn(activityData, "date")) {
        activity.date = utils.getDateStringYYMMdd(activityData.date);
    }

    if(Object.hasOwn(activityData, "isFree")) {
        activity.isFree = activityData.isFree;
    } else {
        activity.isFree = false;
    }

    if(Object.hasOwn(activityData, "price")) activity.price = activityData.price;

    // First "requested", then "confirmed" (then "completed"?)
    if(Object.hasOwn(activityData, "status")) {
        activity.status = activityData.status;
    } 
    else {
        activity.status = "requested";
    }
    if(Object.hasOwn(activityData, "assignedTo")) {
        activity.assignedTo = activityData.assignedTo;
    }

    if(Object.hasOwn(activityData, "time")) activity.time   = activityData.time;
    
    if(Object.hasOwn(activityData, "details"))     activity.details     = activityData.details     ;
    
    if(!isUpdate) {
        activity.createdAt = new Date();
        activity.createdBy = await userService.getUserName();
    }

    return activity;
}

export async function testActivities() {
    const bookingId = "Eric-Klaesson-hh-251110";
    const activityData = {
        category: "transport",
        subCategory: "from-airport",
        date: new Date(2025, 11, 10),
        isFree: false,
        time: "07:00",
        price: 500,
        status: "requested",
        details: "They have 5 bags with them",
        assignedTo: null,
    };

    const activityId = await add(bookingId, activityData);

    const assigned = await assign(bookingId, activityId, "Rena");
    
    const updated = await update(bookingId, activityId, { time: "13:00" });

    const updatedActivity = await getOne(bookingId, activityId);

    const deleted = await remove(bookingId, activityId);
}