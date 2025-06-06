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
 *      before (date),
 *      assignedTo=Dewa, Made, (or empty string), etc...
 *      hasProvider=false|true
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
 *      assignedTo: "", // staff member taking care of the activity
 *      provider: "" // The driver or masseuse
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
export async function assignProvider(bookingId, activityId, personnelId) {
    return await update(bookingId, activityId, { 
        provider: personnelId,
        status: "confirmed"
    });
}

/**
 * Assigns a staff to an activity of a booking, making sure someone is responsible for a good activity execution
 * @param {*} bookingId ID from the bookings collection
 * @param {*} activityId ID from the activities collection, inside a booking document
 * @param {*} userId ID of the staff (i.e. app users)
 * @returns true if update successful, otherwise false
 */
export async function assignStaff(bookingId, activityId, userId) {
    return await update(bookingId, activityId, { 
        assignTo: userId,
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

async function mapObject(data, isUpdate = false) {
    let activity = {};

    if(utils.isString(data?.category))    activity.category = data.category;
    if(utils.isString(data?.subCategory)) activity.subCategory = data.subCategory ;
    if(utils.isString(data?.provider))    activity.provider = data.provider;
    if(utils.isString(data?.details))     activity.details = data.details;

    if(utils.isDate(data?.startingAt))    activity.startingAt = utils.toFireStoreTime(data.startingAt);

    if(utils.isAmount(data?.price))       activity.price = data.price;

    activity.isFree = typeof data?.isFree ? data.isFree : false;
    
    // First "requested", then "confirmed" (then "completed"?)
    activity.status = utils.isString(data?.status) ? data.status : "requested";
    
    activity.assignedTo = utils.isString(data?.assignedTo) ? data.assignedTo : await userService.getUserName();

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
        assignedTo: "",
        provider: "Dewa",
    };

    const activityId = await add(bookingId, activityData);

    // const assigned = await assignProvider(bookingId, activityId, "Rena");


    //const user = userService.getUser();
    // const assigned = await assignStaff(bookingId, activityId, userId);
    
    // const updated = await update(bookingId, activityId, { time: "13:00" });

    // const updatedActivity = await getOne(bookingId, activityId);

    const allActivities = await getAll();
    let x = 1;

    //const deleted = await remove(bookingId, activityId);
}
