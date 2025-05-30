import * as activityDao from '../daos/activityDao.js';
import * as bookingService from './bookingService.js';
import * as utils from "../utils.js";
import * as userService from "./userService.js";

/**
 * @param {*} filterOptions = {category=transport|yoga|etc..,}
 * @returns list of all kinds of activities available (categories and subcategories)
 */
export async function getMenu(filterOptions = {}) {
    return await activityDao.getTypes(filterOptions);
}

/**
 * @returns all activity categories
 */
export async function getCategories() {
    const types = await activityDao.getTypes();
    const categories = types.map((type) => type.category);
    const uniqueCategories = new Set(categories);
    return uniqueCategories;
}

/**
 * @param {*} bookingId 
 * @param {*} filterOptions = {
 *      category=transport|yoga|etc.., 
 *      subCategory=from-airport|to-ubud|etc,
 *      after (date), 
 *      before (date)
 * }
 * @returns activities array, ordered by date (oldest first)
 */
export async function get(bookingId, filterOptions = {}) {
    const activities = await activityDao.getBookingActivities(bookingId, filterOptions);
    activities.map((activity) => {
        if(Object.hasOwn(activity, "startingAt")) {
            activity.date_ddMMM = utils.to_ddMMM(activity.startingAt);
        }
    });
    return activities; 
}

/**
 * @param {*} filterOptions same as get() above
 * @returns all activities across all bookings, ordered by date (oldest first), from today onwards
 */
export async function getAll(filterOptions = {}) {
    const activities = await activityDao.getAllActivities(filterOptions);
    activities.map((activity) => {
        if(Object.hasOwn(activity, "startingAt")) {
            activity.date_ddMMM = utils.to_ddMMM(activity.startingAt);
        }
    });
    return activities; 
}

export async function getOne(bookingId, activityId) {
    return await activityDao.getOne(bookingId, activityId);
}

/**
 * @param {*} bookingId 
 * @param {*} activityData = {
 *      category: "transport",
 *      subCategory: "from-airport",
 *      date: new Date(2025, 11, 10),
 *      isFree: false,
 *      time: "07:00",
 *      price: 500,
 *      status: "requested",
 *      details: "They have 5 bags with them",
 *      assignedTo: null,
 *  }
 * @returns activityId if successful, otherwise false
 */
export async function add(bookingId, activityData) {
    const booking = await bookingService.getOne(bookingId);
    if(!booking) {
        console.error(`Booking with ID ${bookingId} does not exist.`);
        return false;
    }

    let activity = await mapObject(activityData);

    activity.bookingId = bookingId;
    activity.name = booking.name;
    activity.house = booking.house;

    const activityId = makeId(activity.startingAt, bookingId, activity.subCategory);
    const success = await activityDao.add(bookingId, activityId, activity);
    return success ? activityId : false;
}

/**
 * Assigns a personnel to an activity in a booking. Also sets activity status to "confirmed".
 * @param {*} bookingId ID from the bookings collection
 * @param {*} activityId ID from the activities collection, inside a booking document
 * @param {*} personnelId ID from the personnel collection
 * @returns true if update successful, otherwise false
 */
export async function assign(bookingId, activityId, personnelId) {
    return await update(bookingId, activityId, { 
        assignedTo: personnelId,
        status: "confirmed"
    });
}

export async function update(bookingId, activityId, activityUpdateData) {
    let activityUpdate = await mapObject(activityUpdateData, true);
    
    // Don't try to update booking name or house
    if(Object.hasOwn(activityUpdate, "name")) {
        delete activityUpdate.name;
    }
    if(Object.hasOwn(activityUpdate, "house")) {
        delete activityUpdate.house;
    }

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
        activity.category = activityData.category;
    }

    if(Object.hasOwn(activityData, "subCategory")) activity.subCategory = activityData.subCategory ;

    if(Object.hasOwn(activityData, "price")) activity.price = activityData.price     ;
    
    // if(Object.hasOwn(activityData, "date")) {
    //     activity.date = utils.getDateStringYYMMdd(activityData.date);
    // }

    if(Object.hasOwn(activityData, "startingAt")) {
        activity.startingAt = activityData.startingAt;
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

export async function testActivities(date) {
    const categories = await getCategories();
    const activityTypes1 = await getMenu();
    const activityTypes2 = await getMenu({"category": "transport"});

    const bookingId = "Eric-Klaesson-hh-251110";
    const activityData = {
        category: "transport",
        subCategory: "to-airport",
        startingAt: date.toISO(),
        isFree: false,
        price: 1500,
        status: "requested",
        details: "They have 7 bags with them",
        assignedTo: null,
    };

    const activityId = await add(bookingId, activityData);

    // const assigned = await assign(bookingId, activityId, "Rena");
    
    // const updated = await update(bookingId, activityId, { time: "13:00" });

    // const updatedActivity = await getOne(bookingId, activityId);

    const allActivities = await getAll();
    let x = 1;

    //const deleted = await remove(bookingId, activityId);
}
