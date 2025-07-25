import * as activityDao from '../daos/activityDao.js';
import * as bookingService from './bookingService.js';
import * as utils from "../utils.js";
import * as userService from "./userService.js";

/**
 * @param {*} filterOptions = {category=transport|yoga|etc.., house=harmony hill|the jungle nook}
 * @returns list of all kinds of activities available (categories and subcategories)
 */
export async function getActivityMenu(filterOptions = {}) {
    return await activityDao.getTypes(filterOptions);
}

export async function getActivityMenuItem(category, subCategory, house) {
    const menuItems = await getActivityMenu({"category" : category, "subCategory" : subCategory, "house" : house});
    return menuItems.length > 0 ? menuItems[0] : null;
}

/**
 * @returns all activity categories
 */
export async function getCategories() {
    const types = await activityDao.getTypes();
    const categories = types.map((type) => type.category);
    const uniqueCategories = new Set(categories);
    const uniqueCategoriesArray = Array.from(uniqueCategories)
    return uniqueCategoriesArray;
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
    const enhancedActivities = enhanceActivities(activities);
    return enhancedActivities; 
}

/**
 * @param {*} filterOptions same as get() above
 * @returns all activities across all bookings, ordered by date (oldest first), from today onwards
 */
export async function getAll(filterOptions = {}) {
    const activities = await activityDao.getAllActivities(filterOptions);
    const enhancedActivities = enhanceActivities(activities);
    return enhancedActivities; 
}

/**
 * @param {*} activities one object or an array of activity objects
 * @returns enhanced/enriched activity data, needed to properly display them to the user
 */
export function enhanceActivities(activities) {
    const enhance = (activity) => {
        try {
            // Date time stored in timestamp format in database. Convert to Luxon Date time to display correct time zone 
            if(!utils.isEmpty(activity.startingAt)) {
                activity.startingAt = utils.toDateTime(activity.startingAt);
                activity.startingAt_ddMMM = utils.to_ddMMM(activity.startingAt);
                activity.startingAt_ddMMM_HHmm = utils.to_ddMMM_HHmm(activity.startingAt);
            }

            activity.startingAt_HHmm = !utils.isEmpty(activity.startingTime) ? utils.to_HHmm(activity.startingTime) : "Time TBD";

            activity.displayName = activity.subCategory.replace(/-/g, " ");
            activity.displayName = utils.capitalizeWords(activity.displayName);
            
            activity.createdAt_ddMMM_HHmm = utils.to_ddMMM_HHmm(activity.createdAt);
        } catch(e) {
            throw new Error(`Data failure for activity ${activity.id}: ${e.message}`);
        }

        return activity;
    }

    activities = Array.isArray(activities) ? activities.map((activity) => enhance(activity)) : enhance(activities);
    
    return activities; 
}

export async function getOne(bookingId, activityId) {
    const activity = await activityDao.getOne(bookingId, activityId);
    const enhancedActivity = enhanceActivities(activity);
    return enhancedActivity;
}

/**
 * @param {*} bookingId 
 * @param {*} activityData = {
 *      category: "transport",
 *      subCategory: "from-airport",
 *      date: new Date(2025, 11, 10),
 *      isFree: false,
 *      time: "07:00",
 *      customerPrice: 500,
 *      status: "requested",
 *      comments: "They have 5 bags with them",
 *      assignedTo: "", // staff member taking care of the activity
 *      provider: "" // The driver or masseuse
 *  }
 * @returns activityId if successful, otherwise false
 */
export async function add(bookingId, activityData, onError) {
    const booking = await bookingService.getOne(bookingId);
    if(!booking) {
        console.error(`Booking with ID ${bookingId} does not exist.`);
        return false;
    }

    let activity = await mapObject(activityData);

    activity.bookingId = bookingId;
    activity.name = booking.name;
    activity.house = booking.house;

    const activityId = makeId(activity.startingAt, activity.house, activity.subCategory);
    const success = await activityDao.add(bookingId, activityId, activity, onError);
    return success ? activityId : false;
}

/**
 * Assigns a personnel to an activity in a booking. Also sets activity status to "confirmed".
 * @param {*} bookingId ID from the bookings collection
 * @param {*} activityId ID from the activities collection, inside a booking document
 * @param {*} personnelId ID from the personnel collection
 * @returns true if update successful, otherwise false
 */
export async function assignProvider(bookingId, activityId, personnelId, onError) {
    return await update(bookingId, activityId, { 
        provider : personnelId,
        status   : "confirmed"
    }, onError);
}

export async function getProviders(category, subCategory) {
    const providers = await activityDao.getProviders(category, subCategory);
    return providers;
}

/**
 * Assigns a staff to an activity of a booking, making sure someone is responsible for a good activity execution
 * @param {*} bookingId ID from the bookings collection
 * @param {*} activityId ID from the activities collection, inside a booking document
 * @param {*} userId ID of the staff (i.e. app users)
 * @returns true if update successful, otherwise false
 */
export async function assignStaff(bookingId, activityId, userId, onError) {
    return await update(bookingId, activityId, { 
        assignTo: userId,
    }, onError);
}

export async function update(bookingId, activityId, activityUpdateData, onError) {
    let activityUpdate = await mapObject(activityUpdateData, true);
    
    // Don't try to update booking name or house
    if(Object.hasOwn(activityUpdate, "name")) {
        delete activityUpdate.name;
    }
    if(Object.hasOwn(activityUpdate, "house")) {
        delete activityUpdate.house;
    }

    return await activityDao.update(bookingId, activityId, activityUpdate, true, onError);
}

export async function remove(bookingId, activityId) {
    return await activityDao.remove(bookingId, activityId);
}

export function makeId(startingAt, house, subCategory) {
    const houseShort = house.trim().toLowerCase() == "harmony hill" ? "hh" : "jn";
    startingAt = utils.to_YYMMdd(startingAt);
    subCategory = subCategory.trim().toLowerCase().replace(/ /g, '-');
    return `${startingAt}-${houseShort}-${subCategory}-${Date.now()}`;
}

async function mapObject(data, isUpdate = false) {
    let activity = {};

    if(utils.isString(data?.category))      activity.category = data.category;
    if(utils.isString(data?.subCategory))   activity.subCategory = data.subCategory ;
    if(utils.isString(data?.comments))      activity.comments = data.comments;

    if(utils.isDate(data?.startingAt))      activity.startingAt = utils.toFireStoreTime(data.startingAt);
    
    // Date is obligatory, but time might be set later, so might be null
    activity.startingTime = utils.isDate(data?.startingAt) ? utils.toFireStoreTime(data.startingTime) : null;

    if(utils.isAmount(data?.customerPrice)) activity.customerPrice = data.customerPrice;

    activity.isFree = typeof data?.isFree === "boolean" ? data.isFree : false;
    
    if(utils.isString(data?.provider))      activity.provider = data.provider;
    // First "requested", then "confirmed" (then "completed"?)
    activity.status = utils.isString(data?.status) ? data.status : "requested";

    // If a provider is assigned, e.g. a driver to a tour, this must mean the activity is indeed confirmed to happen
    activity.status = utils.isEmpty(activity.provider) ? activity.status : "confirmed";
    
    activity.assignedTo = utils.isString(data?.assignedTo) ? data.assignedTo : await userService.getCurrentUserName();

    return activity;
}

export function validate(data, isUpdate = false) {
    return true; // todo
}

export async function testActivities(date) {
    const categories = await getCategories();
    const activityTypes1 = await getActivityMenu();
    const activityTypes2 = await getActivityMenu({"category": "transport"});

    const bookingId = "Eric-Klaesson-hh-251110";
    const activityData = {
        category: "transport",
        subCategory: "to-airport",
        startingAt: date.toISO(),
        isFree: false,
        customerPrice: 1500,
        status: "requested",
        comments: "They have 7 bags with them",
        assignedTo: "",
        provider: "Dewa",
    };

    const activityId = await add(bookingId, activityData);

    // const assigned = await assignProvider(bookingId, activityId, "Rena");


    //const user = userService.getCurrentUser();
    // const assigned = await assignStaff(bookingId, activityId, userId);
    
    // const updated = await update(bookingId, activityId, { time: "13:00" });

    // const updatedActivity = await getOne(bookingId, activityId);

    const allActivities = await getAll();
    let x = 1;

    //const deleted = await remove(bookingId, activityId);
}
