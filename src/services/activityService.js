import * as activityDao from '../daos/activityDao.js';
import * as bookingService from './bookingService.js';
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import {getParent} from "../daos/dao.js";
import {getMealDishes} from "./mealService.js";

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
    const enhancedActivities = await enhanceActivities(activities);
    return enhancedActivities; 
}

/**
 * @param {*} filterOptions same as get() above
 * @returns all activities across all bookings, ordered by date (oldest first), from today onwards
 */
export async function getAll(filterOptions = {}, onError) {
    const activities = await activityDao.getAllActivities(filterOptions, onError);
    const enhancedActivities = await enhanceActivities(activities);
    return enhancedActivities; 
}

/**
 * @param {*} activities one object or an array of activity objects
 * @returns enhanced/enriched activity data, needed to properly display them to the user
 */
export async function enhanceActivities(activities) {
    const enhance = async (activity) => {
        if(!activity) return;

        const newActivity = activity;
        try {
            // Date time stored in timestamp format in database. Convert to Luxon Date time to display correct time zone 
            if(!utils.isEmpty(activity.startingAt)) {
                newActivity.startingAt = utils.toDateTime(activity.startingAt);
                newActivity.startingAt_ddMMM = utils.to_ddMMM(activity.startingAt);
                newActivity.startingAt_ddMMM_HHmm = utils.to_ddMMM_HHmm(activity.startingAt);
            }

            if(!utils.isEmpty(activity.startingTime)) {
                newActivity.startingTime = utils.toDateTime(activity.startingTime);
                newActivity.startingAt_HHmm = utils.to_HHmm(activity.startingTime);
            } else {
                newActivity.startingTime = null;
                newActivity.startingAt_HHmm = "Time\nTBD";
            }

            // Custom activities might already have a display name given. If not, create one here
            if(utils.isEmpty(activity.displayName)) {
                newActivity.displayName = `${activity.category.replace(/-/g, " ")}: ${activity.subCategory.replace(/-/g, " ")}`;
            } 
            newActivity.displayName = utils.capitalizeWords(activity.displayName);

            if(activity.custom === true) {
                newActivity.subCategory = `Custom: ${activity.displayName}`;
            }

            if(utils.isEmpty(activity.name)) {
                const booking = await getParent(activity);
                newActivity.name = booking ? booking.name : null;
            }
            
            newActivity.createdAt_ddMMM_HHmm = utils.to_ddMMM_HHmm(activity.createdAt);
            newActivity.updatedAt_ddMMM_HHmm = utils.to_ddMMM_HHmm(activity.updatedAt); 
        } catch(e) {
            throw new Error(`Data failure for activity ${activity.id}: ${e.message}`);
        }

        return newActivity;
    }

    activities = Array.isArray(activities)
        ? await Promise.all(activities.map(enhance))
        : await enhance(activities);
        
    return activities; 
}

export async function getOne(bookingId, activityId) {
    const activity = await activityDao.getOne(bookingId, activityId);
    const enhancedActivity = await enhanceActivities(activity);
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
    activity.assigneeAccept = false;

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

export async function setActivityStatus(bookingId, id, status, onError) {
    return await update(bookingId, id, { 
        status : status,
    }, onError);
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
        assignTo          : userId,
        changeDescription : null,
    }, onError);
}

export async function changeAssigneeStatus(accept, bookingId, activityId, onError) {
    return await update(bookingId, activityId, { 
        assigneeAccept  : accept,
        changeDescription : null,
    }, onError);
}

export async function update(bookingId, activityId, activityUpdateData, onError) {
    const existing = await getOne(bookingId, activityId);

    let activityUpdate = await mapObject(activityUpdateData, true);

    // When changing assignee 
    if(utils.exists(activityUpdate, "assignedTo") && utils.isString(activityUpdate.assignedTo) && existing.assignedTo !== activityUpdate.assignedTo) {
        activityUpdate.assigneeAccept = false;
    }
    
    // Don't try to update booking name or house
    if(utils.exists(activityUpdate, "name")) {
        delete activityUpdate.name;
    }
    if(utils.exists(activityUpdate, "house")) {
        delete activityUpdate.house;
    }

    return await activityDao.update(bookingId, activityId, activityUpdate, true, onError);
}

export async function remove(bookingId, activityId, onError) {
    return await activityDao.remove(bookingId, activityId, onError);
}

export function makeId(startingAt, house, subCategory) {
    const houseShort = house.trim().toLowerCase() === "harmony hill" ? "hh" : "jn";
    startingAt = utils.to_YYMMdd(startingAt);
    subCategory = subCategory.trim().toLowerCase().replace(/ /g, '-');
    return `${startingAt}-${houseShort}-${subCategory}-${Date.now()}`;
}

async function mapObject(data) {
    let activity = {};

    if(utils.isString(data?.category))      activity.category = data.category;
    if(utils.isString(data?.subCategory))   activity.subCategory = data.subCategory ;
    if(utils.isString(data?.comments))      activity.comments = data.comments;
    if(utils.isString(data?.displayName))   activity.displayName = data.displayName;

    if(utils.isDate(data?.startingAt))      activity.startingAt = utils.toFireStoreTime(data.startingAt);
    
    // Date is obligatory, but time might be set later, so startingTime might be null now
    if(utils.exists(data, "startingTime")) {
        activity.startingTime = utils.isDate(data?.startingTime) ? utils.toFireStoreTime(data.startingTime) : null;
    }

    if(utils.isAmount(data?.customerPrice)) activity.customerPrice = data.customerPrice;

    if(utils.exists(data, "isFree")) {
        activity.isFree = typeof data?.isFree === "boolean" ? data.isFree : false;
    }
    
    if(utils.exists(data, "needsProvider") && !utils.isEmpty(data.needsProvider)) {
        activity.needsProvider = data.needsProvider;
        if(data.needsProvider === true) {
            if(utils.isString(data?.provider))      activity.provider = data.provider;
            if(utils.isAmount(data?.providerPrice)) activity.providerPrice = data.providerPrice;
        } else {
            activity.provider = null;
            activity.providerPrice = null;
        }
    } else {
        if(utils.isString(data?.provider))      activity.provider = data.provider;
        if(utils.isAmount(data?.providerPrice)) activity.providerPrice = data.providerPrice;
    }

    if(utils.exists(data, "status") ) {
        activity.status = utils.isString(data?.status) ? data.status : "requested";
    }

    if(utils.isString(data?.assignedTo)) activity.assignedTo = data.assignedTo;
    if(utils.isBoolean(data?.assigneeAccept)) activity.assigneeAccept = data.assigneeAccept;

    if(utils.exists(data, "changeDescription")) {
        activity.changeDescription = data.changeDescription;
    }

    return activity;
}

export function validate(customer, data, isUpdate, onError) {
    try {
        if(utils.isEmpty(data)) {
            onError("Fill in all required fields to submit");
            return false;
        }
        if(utils.isEmpty(data.startingAt)) {
            onError("Activity date required");
            return false;
        }

        if(data.startingAt.startOf('day') < customer.checkInAt.startOf('day')) {
            onError(`Activity date too early. Must be within ${utils.to_ddMMM(customer.checkInAt)} - ${utils.to_ddMMM(customer.checkOutAt)}`);
            return false;
        }

        if(data.startingAt.startOf('day') > customer.checkOutAt.startOf('day')) {
            onError(`Activity date too late. Must be within ${utils.to_ddMMM(customer.checkInAt)} - ${utils.to_ddMMM(customer.checkOutAt)}`);
            return false;
        }
        
        // If dateTime decided and staff assigned, then it counts as confirmed
        if(data.status === "confirmed") {
            if(utils.isEmpty(data.assignedTo)) {
                onError(`Status can only be "confirmed" if a staff member is assigned`);
                return false;
            } 
            if(!utils.isDate(data.startingAt)) {
                onError(`Status can only be "confirmed" if a date is set`);
                return false;
            }
            if(!utils.isDate(data.startingTime)) {
                onError(`Status can only be "confirmed" if a time is set`);
                return false;
            }

            if(data.internal !== true && utils.isEmpty(data.provider)) {
                onError(`Status can only be "confirmed" if a provider is assigned`);
                return false;
            }

            if(data.needsProvider === true && utils.isEmpty(data.provider)) {
                onError(`Needs provider. Status can only be "confirmed" if a provider is assigned`);
                return false;
            }
        }
    } catch(e) {
        onError(`Unexpected error in activity form: ${e.message}`);
        return true;  // A bug shouldn't prevent you from submitting an activity
    }

    return true; 
}

/**
 * If the activity data changes, in a way that the assignee needs to be aware of, make the assignee accept the task again
 * @param {} oldData 
 * @param {*} newData 
 * @returns 
 */
export async function getChangeDescription(oldData, newData) {
    let changeDescription = [];

    if(!utils.dateIsSame(oldData.startingAt, newData.startingAt)) {
        changeDescription.push(`New start date: from ${utils.to_yyMMddHHmm(oldData.startingAt, "/")} to ${utils.to_yyMMddHHmm(newData.startingAt, "/")}`);
    }

    if(oldData.provider !== newData.provider) {
        changeDescription.push(`New provider: from ${oldData.provider} to ${newData.provider}`);
    }

    if(oldData.comments !== newData.comments) {
        changeDescription.push(`Comments update: from ${oldData.comments} to ${newData.comments}`);
    }

    if(!utils.isEmpty(newData?.dishes)) {
        if(utils.isEmpty(oldData.dishes)) {
            changeDescription.push(`Dishes added to the meal`);
        }

        const oldDishes = await getMealDishes(oldData.bookingId, oldData.id);

        for(const newDish of newData.dishes) {         
            const oldDish = oldDishes.find((dish) => dish.name === newDish.name);
            if(!oldDish) {
                changeDescription.push(`New dish added: ${newDish.quantity}x ${newDish.name}`);
            }
            else if(oldDish.quantity !== newDish.quantity) {
                changeDescription.push(`Dish amount for "${newDish.name}" changed, from ${oldDish.quantity}x to ${newDish.quantity}x`);
            }
        }
    }
    return changeDescription;
}

export async function toArrays(filters, onError) {
    const documents = await getAll(filters, onError);

    const headers = [
        "startingAt",
        "displayName",
        "name", // guest name
        "house",
        "customerPrice",
        "provider",
        "providerPrice",
        "id",
    ];

    let rows = [headers];

    for(const document of documents) {
        let values = [];
        for(const header of headers) {
            values.push((utils.exists(document, header) ? document[header] : "-"))
        }

        rows.push(values);
    }

    return rows;
}
