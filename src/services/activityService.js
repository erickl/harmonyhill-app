import * as activityDao from '../daos/activityDao.js';
import * as bookingService from './bookingService.js';
import * as utils from "../utils.js";
import {getParent} from "../daos/dao.js";
import {getMealDishes} from "./mealService.js";
import {get as getIncome} from "../services/incomeService.js";
import {get as getExpense} from "../services/expenseService.js";
import * as storageDao from "../daos/storageDao.js";
import {commitTx, decideCommit} from "../daos/dao.js";
import {removeCounts as removeMinibarCounts} from "./minibarService.js";
import * as ActivityStatus from "../models/ActivityStatus.js";
import {Alert} from "../models/Alert.js";

export const sortActivitiesByDate = (activities) => {
    const enhancedActivities = enhanceActivities(activities);
     const activitiesByDate = enhancedActivities.reduce((m, activity) => {     
        const date = activity.startingAt_ddMMM ? activity.startingAt_ddMMM : "Date TBD";
        if(!m[date]) m[date] = [];
        m[date].push(activity);
        return m;
    }, {});

    return activitiesByDate;
}

/**
 * @param {*} filterOptions = {category=transport|yoga|etc.., house=harmony hill|the jungle nook}
 * @returns list of all kinds of activities available (categories and subcategories)
 */
export async function getActivityTypes(filterOptions = {}) {
    return await activityDao.getTypes(filterOptions);
}

export async function getActivityType(category, subCategory, house) {
    const filter = {};
    if(category) filter.category = category;
    if(subCategory) filter.subCategory = subCategory;
    if(house) filter.house = house;
    const menuItems = await getActivityTypes(filter);
    return menuItems.length > 0 ? menuItems[0] : null;
}

export function getInitialActivityData(activityType) {
    //const activityType = await getActivityType(category, subCategory, house);
    const activity = {
        category      : activityType.category,
        subCategory   : activityType.subCategory,
        displayName   : activityType.displayName,
        customerPrice : activityType.customerPrice,
        custom        : activityType.custom,
        internal      : activityType.internal,
        needsProvider : activityType.needsProvider || activityType.internal === false,
        assignedTo    : null,
        startingAt    : null,
        startingTime  : null,
        status        : "guest confirmed",
    };

    return activity;
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
 * @param {*} booking object
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
export async function get(booking, filterOptions = {}, onError) {
    const activities = await activityDao.getBookingActivities(booking.id, filterOptions, onError);
    const enhancedActivities = enhanceActivities(activities);
    return enhancedActivities; 
}

/**
 * Get an activities collection which is updated live as updates come in from other users
 * @param {*} booking the customer object. If null, get activities from all users
 * @param {*} setDocs, the setter callback, in which to save the updating DB documents 
 * @param {*} filterOptions 
 * @param {*} onError 
 */
export function subscribe(booking, setDocs, filterOptions = {}, onError) {
    if(booking) {
        return activityDao.subscribe(booking.id, setDocs, filterOptions, onError);
    } else {
        return activityDao.subscribeAll(setDocs, filterOptions, onError);
    }   
}

/**
 * @param {*} filterOptions same as get() above
 * @returns all activities across all bookings, ordered by date (oldest first), from today onwards
 */
export async function getAll(filterOptions = {}, onError) {
    const activities = await activityDao.getAllActivities(filterOptions, onError);
    const enhancedActivities = enhanceActivities(activities);
    return enhancedActivities; 
}

/**
 * @param {*} activities one object or an array of activity objects
 * @returns enhanced/enriched activity data, needed to properly display them to the user
 */
export function enhanceActivities(activities) {
    const enhance = (activity) => {
        if(!activity) return;
        if(utils.exists(activity, "createdAt_ddMMM_HHmm")) return activity; // has already been enhanced

        const newActivity = utils.deepCopy(activity);
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

            // if(utils.isEmpty(activity.name)) {
            //     const booking = !booking ? await getParent(activity) : booking;
            //     newActivity.name = booking ? booking.name : null;
            // }
            
            newActivity.createdAt_ddMMM_HHmm = utils.to_ddMMM_HHmm(activity.createdAt);
            newActivity.updatedAt_ddMMM_HHmm = utils.to_ddMMM_HHmm(activity.updatedAt); 
        } catch(e) {
            throw new Error(`Data failure for activity ${activity.id}: ${e.message}`);
        }

        return newActivity;
    }

    activities = Array.isArray(activities)
        ? activities.map(enhance)
        : enhance(activities);
        
    return activities; 
}

/**
 * 
 * @param {*} booking object 
 * @param {*} activityId 
 * @returns the activity object or null if it wasn't found
 */
export async function getOne(booking, activityId) {
    const activity = await activityDao.getOne(booking.id, activityId);
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
 *      status: "pending guest confirmation",
 *      comments: "They have 5 bags with them",
 *      assignedTo: "", // staff member taking care of the activity
 *      provider: "" // The driver or masseuse
 *  }
 * @returns activityId if successful, otherwise false
 */
export async function add(booking, activityData, onError, writes = []) {
    const commit = decideCommit(writes);

    const activity = mapObject(activityData);
    activity.assigneeAccept = false;

    activity.bookingId = booking.id;
    activity.name = booking.name;
    activity.house = booking.house;

    const activityId = makeId(activity.startingAt, activity.house, activity.subCategory);
    const result = await activityDao.add(booking.id, activityId, activity, onError, writes);
    if(result === false) return false;
    
    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    
    const enhancedRecord = enhanceActivities(result);
    return enhancedRecord;
}

/**
 * Assigns a personnel to an activity in a booking
 * @param {*} bookingId ID from the bookings collection
 * @param {*} activityId ID from the activities collection, inside a booking document
 * @param {*} personnelId ID from the personnel collection
 * @returns true if update successful, otherwise false
 */
export async function assignProvider(bookingId, activityId, personnelId, onError, writes = []) {
    const commit = decideCommit(writes);

    const dataUpdate = { provider : personnelId };
    const result = await update(bookingId, activityId, dataUpdate, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function getProviders(category, subCategory) {
    const providers = await activityDao.getProviders(category, subCategory);
    return providers;
}

export async function setActivityStatus(activity, newStatus, onError, writes = []) {
    const commit = decideCommit(writes);

    const updatedData = { status : newStatus };

    if(ActivityStatus.Started.equals(newStatus)) {
        // If activity is not delayed, set startingTime when starting activity
        if(activity.startingTime === null || utils.isFuture(activity.startingTime)) {
            updatedData["startingTime"] = utils.now();
        }
    }

    const result = await update(activity.bookingId, activity.id, updatedData, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

/**
 * Assigns a staff to an activity of a booking, making sure someone is responsible for a good activity execution
 * @param {*} bookingId ID from the bookings collection
 * @param {*} activityId ID from the activities collection, inside a booking document
 * @param {*} userId ID of the staff (i.e. app users)
 * @returns true if update successful, otherwise false
 */
export async function assignStaff(bookingId, activityId, userId, onError, writes = []) {
    const commit = decideCommit(writes);

    const dataUpdate = { assignTo : userId, changeDescription : null };
    const result = await update(bookingId, activityId, dataUpdate, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function changeAssigneeStatus(accept, booking, activity, onError, writes = []) {
    const commit = decideCommit(writes);

    const dataUpdate = { 
        assigneeAccept  : accept,
        changeDescription : null,
    };

    const result = await update(booking, activity, dataUpdate, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function update(booking, activity, activityUpdateData, onError, writes = []) {
    const commit = decideCommit(writes);

    let activityUpdate = mapObject(activityUpdateData, true);

    // When changing assignee 
    if(utils.exists(activityUpdate, "assignedTo") && utils.isString(activityUpdate.assignedTo) && activity.assignedTo !== activityUpdate.assignedTo) {
        activityUpdate.assigneeAccept = false;
        activityUpdate.changeDescription = null;
    }
    
    // Don't try to update booking name or house
    if(utils.exists(activityUpdate, "name")) {
        delete activityUpdate.name;
    }
    if(utils.exists(activityUpdate, "house")) {
        delete activityUpdate.house;
    }

    const result = await activityDao.update(activity.bookingId, activity.id, activityUpdate, true, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    const enhancedResult = enhanceActivities(result);
    return enhancedResult;
}

export function getActivityPhotoFilePath(activity) {
    if(!activity) return "";
    const activityDate = utils.to_yyMMM(activity.startingAt, "-");
    const filePath = `activities/photos/${activityDate}/${activity.id}`;
    return filePath;
}

export async function getPhotos(activity, onError) {
    return await activityDao.getPhotos(activity.bookingId, activity.id, onError);
}

export async function removePhoto(photo, onError, writes = []) {
    const commit = decideCommit(writes);

    const removeFileResult = await storageDao.removeFile(photo.fileName, onError);
    if(removeFileResult === false) return false;
    
    const activity = await getParent(photo);
    if(!activity) return false;

    const booking = await getParent(activity);
    if(!booking) return false;

    const result = await activityDao.removePhoto(booking.id, activity.id, photo.id, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

async function removePhotos(activity, onError, writes = []) {
    const commit = decideCommit(writes);

    const photos = await getPhotos(activity, onError);
    for(const photo of photos) {
        const removePhotoResult = await removePhoto(photo, onError, writes);
        if(removePhotoResult === false) return false;
    }

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    
    return true;
}

export async function uploadPhoto(activity, fileData, onError, writes = []) {
    const commit = decideCommit(writes);

    if(fileData.downloadUrl === false) {
        return;
    }
    const id = `activity-photo-${Date.now()}`;
    const data = {
        fileName   : fileData.filename,
        url        : fileData.url,
        activityId : activity.id,
    };

    const result = await activityDao.addPhoto(activity.bookingId, activity.id, id, data, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function remove(activity, onError, writes = []) {
    const commit = decideCommit(writes);

    const removePhotosResult = await removePhotos(activity, onError, writes);
    if(removePhotosResult === false) return false;

    // If activity is checkin-prep, housekeeping or checkout, if will have resulted minibar counts
    const removeMinibarCountsResult = await removeMinibarCounts(activity, onError, writes);
    if(removeMinibarCountsResult === false) return false;

    const result = await activityDao.remove(activity.bookingId, activity.id, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export function makeId(startingAt, house, subCategory) {
    const houseShort = house.trim().toLowerCase() === "harmony hill" ? "hh" : "jn";
    startingAt = utils.to_YYMMdd(startingAt);
    subCategory = subCategory.trim().toLowerCase().replace(/ /g, '-');
    return `${startingAt}-${houseShort}-${subCategory}-${Date.now()}`;
}

function mapObject(data) {
    let activity = {};

    if(utils.isString(data?.category))      activity.category = data.category;
    if(utils.isString(data?.subCategory))   activity.subCategory = data.subCategory ;
    if(utils.isString(data?.comments))      activity.comments = data.comments;
    if(utils.isString(data?.displayName))   activity.displayName = data.displayName;

    // startingAt might be null if activity is still unscheduled
    if(utils.exists(data, "startingAt")) {
        activity.startingAt = utils.isDate(data?.startingAt) ? utils.toFireStoreTime(data.startingAt) : null;
    }
    
    // Date is obligatory, but time might be set later, so startingTime might be null now
    if(utils.exists(data, "startingTime")) {
        activity.startingTime = utils.isDate(data?.startingTime) ? utils.toFireStoreTime(data.startingTime) : null;
    }

    if(utils.isAmount(data?.customerPrice)) activity.customerPrice = data.customerPrice;

    if(utils.exists(data, "isFree")) {
        activity.isFree = typeof data?.isFree === "boolean" ? data.isFree : false;
    } else {
        activity.isFree = false;
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

export function validate(customer, data, isUpdate, onError, onWarning) {
    let warning = false;
    try {
        if(utils.isEmpty(data)) {
            onError("Fill in all required fields to submit");
            return false;
        }

        if(utils.isEmpty(data.startingAt)) {
            warning = true;
            onWarning("Activity date not set");
        }

        if(data.startingAt && data.startingAt.startOf('day') < customer.checkInAt.startOf('day')) {
            warning = true;
            onWarning(`Beware! Activity date is before checkin date ${utils.to_ddMMM(customer.checkInAt)}`);
            //return false; // We will allow this as there are exceptions, but display a warning
        }

        if(data.startingAt && data.startingAt.startOf('day') > customer.checkOutAt.startOf('day')) {
            warning = true;
            onWarning(`Beware! Activity date is after checkout date ${utils.to_ddMMM(customer.checkOutAt)}`);
            //return false; // We will allow this as there are exceptions, but display a warning
        }

        if(!warning) {
            onWarning(null);
        }

        if(ActivityStatus.PendingGuestConfirmation.equals(data.status) && !utils.isEmpty(data.provider)) {
            onError(`Don't book a provider before the guest has confirmed`);
            return false;
        }
    } catch(e) {
        onError(`Unexpected error in activity form: ${e.message}`);
        return true;  // A bug shouldn't prevent you from submitting an activity
    }

    onError(null);

    return true; 
}

/**
 * If the activity data changes, in a way that the assignee needs to be aware of, make the assignee accept the task again
 * @param {} oldData 
 * @param {*} newData 
 * @returns 
 */
export function getChangeDescription(oldData, newData) {
    let changeDescription = [];

    if(utils.exists(oldData, "changeDescription")) {
        changeDescription = oldData.changeDescription;
    }

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
        for(const newDish of newData.dishes) {         
            const oldDish = oldData.dishes.find((dish) => dish.name === newDish.name);
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

    try {
        if(activity == null) return alert();
        if(activityUnit == null) return alert();

        // Haven't started yet, and past startingTime ==> Overdue
        if(ActivityStatus.Started.greaterThan(currentStatus) && utils.isPast(activity.startingTime)) {
            return alert(Alert.OVERDUE, "Activity should have been started already!");
        }

        const timeLeft = activity.startingAt ? activity.startingAt.diff(utils.now(), ["hours"]) : 999;
        const hoursLeft = Math.floor(timeLeft.hours);
        const urgent = !utils.isEmpty(activityUnit.deadline1) && hoursLeft <= activityUnit.deadline1;
        const emergency = !utils.isEmpty(activityUnit.deadline2) && hoursLeft <= activityUnit.deadline2;
        
        if(ActivityStatus.PendingGuestConfirmation.equals(currentStatus)) {
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

        const isLaterToday = utils.isToday(activity.startingAt) && utils.isPast(activity.startingAt);
        const isTodayOrTomorrow = utils.isTomorrow(activity.startingAt) || isLaterToday;
        if(isTodayOrTomorrow) {
            if(utils.isEmpty(activity.assignedTo)) {
                return alert(Alert.URGENT, "Assign task to someone");
            }
            const assignedNotYetAccepted = (!utils.exists(activity, "assigneeAccept") || activity.assigneeAccept === false);
            if(ActivityStatus.StaffNotConfirmed.equals(currentStatus) && assignedNotYetAccepted) {
                return alert(Alert.URGENT, "Accept the task");
            }
        }

        // Todo: use started status, when we have the ability to ask for photos via the app
        // if(!utils.isEmpty(activity.startingTime) && hoursLeft < 0) {
        //     if(currentStatus === Status.GOOD_TO_GO) {
        //         return alert(Alert.URGENT, "Did it start?");
        //     }
        // } 
    } catch(e) {
        onError(`(getAlert) Error in activity ${activity.displayName}: ${e.message}`);
    }

    return alert(Alert.NONE);
}

export async function getStatus(activity, activityInfo, onError) {
    if(activity == null) return ActivityStatus.None;

    if(ActivityStatus.PendingGuestConfirmation.equals(activity.status)) {
        return ActivityStatus.PendingGuestConfirmation;
    }

    if(activity.needsProvider === true && utils.isEmpty(activity.provider)) {
        return ActivityStatus.BookProvider;
    }

    if(utils.isEmpty(activity.assignedTo)) {
        if(utils.isBeforeToday(activity.startingAt)) {
            return ActivityStatus.AssignStaff.withMessage("Staff assignment overdue!");
        // If activity is today, assigning staff
        } else if(utils.isToday(activity.startingAt)) {
            return ActivityStatus.AssignStaff;
        // Start assigning staff after 17:00 the day before the activity
        } else if(utils.isTomorrow(activity.startingAt)) {
            const todayAtFivePm = utils.today().set({hour: 17});
            if(utils.isPast(todayAtFivePm)) {
                return ActivityStatus.AssignStaff;
            }
        } 
    }

    if(utils.isEmpty(activity.startingTime)) {
        return ActivityStatus.DetailsMissing.withMessage("Set starting time");
    }

    if(activity.isFree === false && utils.isEmpty(activity.customerPrice)) {
        return ActivityStatus.DetailsMissing.withMessage("Provide customer price");
    }

    if(activity.needsProvider === true && utils.isEmpty(activity.providerPrice)) {
        return ActivityStatus.DetailsMissing.withMessage("Provide provider price");
    }

    if(activity.assigneeAccept !== true) {
        if(utils.isTomorrow(activity.startingAt) || utils.isToday(activity.startingAt)) {
            return ActivityStatus.StaffNotConfirmed;
        }
    }

    if(ActivityStatus.Completed.equals(activity.status)) {
        // Checking commissions and expenses only needed for external activities, with providers
        if(activityInfo.internal !== true) {
            const activityNeedsCommission = needsCommission(activity);
            const activityHasCommission = await hasCommission(activity, onError);
            if(activityNeedsCommission && !hasCommission) {
                return ActivityStatus.AwaitingCommission;
            } else if(!activityNeedsCommission && activityHasCommission) {
                return ActivityStatus.RemoveCommission;
            }

            const activityNeedsExpense = needsExpense(activity);
            const activityHasExpense = await hasExpense(activity, onError);
            if(activityNeedsExpense && !activityHasExpense) {
                return ActivityStatus.AwaitingExpense;
            } else if(!activityNeedsExpense && activityHasExpense) {
                return ActivityStatus.RemoveExpense;
            }
        }

        return ActivityStatus.Completed;
    }

    if(ActivityStatus.GuestConfirmed.equals(activity.status)) {
        return ActivityStatus.GoodToGo;
    } else if(ActivityStatus.Started.equals(activity.status)) {
        return ActivityStatus.Started;
    }

    return ActivityStatus.None;
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
    const providerPriceExists = utils.isNumber(activity.providerPrice) && activity.providerPrice > 0;   
    const isPast = utils.isPast(activity.startingAt);
    const needsCommission = providerPriceExists && isPast;
    return needsCommission;
}

export function needsExpense(activity) {
    const providerPriceExists = utils.isNumber(activity.providerPrice) && activity.providerPrice > 0;   
    const isPast = utils.isPast(activity.startingAt);
    const needsExpenseNow = providerPriceExists && isPast;
    return needsExpenseNow;
}

export async function toArrays(filters, onProgress, onError) {
    const documents = await getAll(filters, onError);

    const headers = [
        "startingAt",
        "displayName",
        "name", // guest name
        "isFree",
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
