import * as activityDao from '../daos/activityDao.js';
import * as bookingService from './bookingService.js';
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import {getParent} from "../daos/dao.js";
import {getMealDishes} from "./mealService.js";
import {get as getIncome} from "../services/incomeService.js";
import {get as getExpense} from "../services/expenseService.js";

export const Status = Object.freeze({
    GOOD_TO_GO            : "good to go",
    COMPLETED             : "completed",
    PENDING_GUEST_CONFIRM : "pending guest confirmation",
    GUEST_CONFIRMED       : "guest confirmed",
    PLEASE_BOOK           : "please book",
    ASSIGN_STAFF          : "assign staff",
    STAFF_NOT_CONFIRM     : "staff not confirmed",
    DETAILS_MISSING       : "details missing",
    STARTED               : "started",
    COMPLETED             : "completed",
    AWAIT_COMMISSION      : "awaiting commission",
    REMOVE_COMMISSION     : "remove commission",
    AWAIT_EXPENSE         : "awaiting expense",
    REMOVE_EXPENSE        : "remove expense",
    NONE                  : "",
});

export const Alert = Object.freeze({
    ATTENTION  : "attention",
    URGENT     : "urgent",
    EMERGENCY  : "emergency",
    NONE       : "",
});

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
 *      status: "pending guest confirmation",
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
 * Assigns a personnel to an activity in a booking
 * @param {*} bookingId ID from the bookings collection
 * @param {*} activityId ID from the activities collection, inside a booking document
 * @param {*} personnelId ID from the personnel collection
 * @returns true if update successful, otherwise false
 */
export async function assignProvider(bookingId, activityId, personnelId, onError) {
    return await update(bookingId, activityId, { 
        provider : personnelId,
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
        activity.status = utils.isString(data?.status) ? data.status.trim().toLowerCase() :  "pending guest confirmation";
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

        if(data.status === Status.PENDING_GUEST_CONFIRM && !utils.isEmpty(data.provider)) {
            onError(`Don't book a provider before the guest has confirmed`);
            return false;
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

export function getAlert(activity, currentStatus, activityUnit, onError) {
    const alert = (category = Alert.NONE, message = "") => {
        return { "category" : category, "message" : (utils.isEmpty(message) ? category : message) };
    };

    if(activity == null) return alert();
    if(activityUnit == null) return alert();

    const timeLeft = activity.startingAt.diff(utils.now(), ["hours"]);
    const hoursLeft = Math.floor(timeLeft.hours);
    const urgent = !utils.isEmpty(activityUnit.deadline1) && hoursLeft <= activityUnit.deadline1;
    const emergency = !utils.isEmpty(activityUnit.deadline2) && hoursLeft <= activityUnit.deadline2;
    
    if(currentStatus === Status.PENDING_GUEST_CONFIRM) {
        if(emergency) {
            return alert(Alert.EMERGENCY, "Confirm with guest immediately!");
        }

        if(urgent) {
            return alert(Alert.URGENT, "Confirm with guest");
        }
    }

    const needsProvider = activity.needsProvider === true && utils.isEmpty(activity.provider);
    if(needsProvider) {
        if(emergency) {
            return alert(Alert.EMERGENCY, "Book activity now!");
        }

        if(urgent) {
            return alert(Alert.URGENT, "Book activity!");
        }
    }

    const isTodayOrTomorrow = (utils.isTomorrow(activity.startingAt) || utils.isToday(activity.startingAt));
    if(isTodayOrTomorrow) {
        if(utils.isEmpty(activity.assignedTo)) {
            return alert(Alert.URGENT, "Assign task to someone");
        }
        const assignedNotYetAccepted = (!utils.exists(activity, "assigneeAccept") || activity.assigneeAccept === false);
        if(currentStatus === Status.STAFF_NOT_CONFIRM && assignedNotYetAccepted) {
            return alert(Alert.URGENT, "Accept the task");
        }
    }

    if(!utils.isEmpty(activity.startingTime) && hoursLeft < 0) {
        if(currentStatus === Status.GOOD_TO_GO) {
            return alert(Alert.URGENT, "Did it start?");
        }
    } 

    return alert(Alert.NONE);
}

export function status(category = Status.NONE, message = "") {
    return { "category" : category, "message" : (utils.isEmpty(message) ? category : message) };
};

export async function getStatus(activity, onError) {
    if(activity == null) return status();

    if(activity.status === Status.PENDING_GUEST_CONFIRM) {
        return status(Status.PENDING_GUEST_CONFIRM);
    }
    if(activity.needsProvider === true && utils.isEmpty(activity.provider)) {
        return status(Status.PLEASE_BOOK);
    }
    if(utils.isEmpty(activity.assignedTo)) {
        return status(Status.ASSIGN_STAFF);
    }
    if(utils.isEmpty(activity.startingTime)) {
        return status(Status.DETAILS_MISSING, "Set starting time");
    }
    if(activity.isFree === false && utils.isEmpty(activity.customerPrice)) {
        return status(Status.DETAILS_MISSING, "Provide customer price");
    }
    if(activity.needsProvider === true && utils.isEmpty(activity.providerPrice)) {
        return status(Status.DETAILS_MISSING, "Provide provider price");
    }
    // Todo: for this, we have to fetch the dishes, which we normally don't do until the activity details component is expanded
    // if(activity.category === "meal" && utils.isEmpty(activity.dishes)) {
    //     return status(Status.DETAILS_MISSING, "Dishes missing");
    // }
    if(activity.assigneeAccept !== true) {
        if(utils.isTomorrow(activity.startingAt) || utils.isToday(activity.startingAt)) {
            return status(Status.STAFF_NOT_CONFIRM);
        }
    }

    if(activity.status === Status.COMPLETED) {
        const activityNeedsCommission = needsCommission(activity);
        const activityHasCommission = await hasCommission(activity, onError);
        if(activityNeedsCommission && !hasCommission) {
            return status(Status.AWAIT_COMMISSION);
        } else if(!activityNeedsCommission && activityHasCommission) {
            return status(Status.REMOVE_COMMISSION);
        }

        const activityNeedsExpense = needsExpense(activity);
        const activityHasExpense = await hasExpense(activity, onError);
        if(activityNeedsExpense && !activityHasExpense) {
            return status(Status.AWAIT_EXPENSE);
        } else if(!activityNeedsExpense && activityHasExpense) {
            return status(Status.REMOVE_EXPENSE);
        } else {
            return status(Status.COMPLETED); 
        }
    }

    if(activity.status === Status.GUEST_CONFIRMED) {
        return status(Status.GOOD_TO_GO);
    } else if(activity.status === Status.STARTED) {
        return status(Status.STARTED);
    }

    return status(Status.NONE);
}

export async function hasExpense(activity, onError) {
    const expenses = await getExpense({activityId : activity.id}, onError);
    const existingExpense = expenses.length > 0 ? expenses[0] : null;
    return existingExpense !== null;
}

export async function hasCommission(activity, onError) {
    const commissions = await getIncome({activityId : activity.id}, onError);
    const existingCommission = commissions.length > 0 ? commissions[0] : null;
    return existingCommission !== null;
}

export function needsCommission(activity) {
    const noCustomerPrice = !utils.exists(activity, "customerPrice") || utils.isEmpty(activity.customerPrice) || activity.customerPrice == 0;
    const providerPriceExists = utils.isNumber(activity.providerPrice) && activity.providerPrice > 0;   
    const isPast = utils.isPast(activity.startingAt);
    const needsCommission = noCustomerPrice && providerPriceExists && isPast;
    return needsCommission;
}

export function needsExpense(activity) {
    const customerPriceExists = utils.exists(activity, "customerPrice") && !utils.isEmpty(activity.customerPrice) && activity.customerPrice > 0;
    const providerPriceExists = utils.isNumber(activity.providerPrice) && activity.providerPrice > 0;   
    const isPast = utils.isPast(activity.startingAt);
    const needsExpenseNow = customerPriceExists && providerPriceExists && isPast;
    return needsExpenseNow;
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
