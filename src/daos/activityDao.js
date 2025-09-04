import { where, orderBy, getDoc, collectionGroup } from 'firebase/firestore';
import * as dao from "./dao.js"
import * as utils from "../utils.js";

export async function add(bookingId, activityId, activity, onError) {
    return await dao.add([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, activity, onError);
}

export async function update(bookingId, activityId, activityData, updateLogs = true, onError = null) {
    return await dao.update([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, activityData, updateLogs, onError);
}

export async function addDish(bookingId, mealId, dishId, dish, onError) { 
    return await dao.add([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, dao.constant.DISHES], dishId, dish, onError);
}

export async function deleteDish(bookingId, mealId, dishId) { 
    return await dao.remove([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, dao.constant.DISHES], dishId);
}

export async function updateDish(bookingId, mealId, dishId, dish, onError) {
    return await dao.update([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, dao.constant.DISHES], dishId, dish, true, onError);
}

export async function transaction(inTransaction) {
return dao.transaction(inTransaction);
}

export async function getProviders(category, subCategory) {
    let filters = [
        where("category",    category   ),
        where("subCategory", subCategory)
    ];

    const providers = await dao.get([dao.constant.ACTIVITY_TYPES], filters);
    return providers;
}

// Only delete the whole meal if all mealItems are deleted first
export async function deleteMeal(bookingId, mealId) {
    const dishes = await dao.get([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, dao.constant.DISHES]);
    if(dishes.length === 0) {
        return await remove([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], mealId);  
    }
    return false;
}

// mealCategory = "breakfast", "lunch", "dinner", "snack", "afternoon tea", "floating breakfast"
export async function getMeals(bookingId, options = {}) {  
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];
    let filters = [];

    if(!Object.hasOwn(options, "category")) {
        options.category = "meal";
    }

    // startingAt is a string in the format YYYY-MM-DD, without time
    if (Object.hasOwn(options, "startingAt")) {
        filters.push(where("startingAt", "==", utils.toFireStoreTime(options.startingAt)));
    }

    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }
    
    const meals = await dao.get(path, filters);
    const sortedMeals = dao.sort(meals, "startingAt");

    return sortedMeals;
}

export async function getBookingActivities(bookingId, options = {}) { 
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];

    let filters = [];
    
    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }

    if (Object.hasOwn(options, "after")) {
        filters.push(where("startingAt", ">=", utils.toFireStoreTime(options.after)));
    }

    if (Object.hasOwn(options, "before")) {
        filters.push(where("startingAt", "<=", utils.toFireStoreTime(options.before)));
    }

    if (Object.hasOwn(options, "assignedTo")) {
        filters.push(where("assignedTo", "==", options.assignedTo));
    }

    if (Object.hasOwn(options, "hasProvider")) {
        filters.push(where("provider", options.hasProvider ? "!=" : "==", ""));
    }

    const activities = await dao.get(path, filters);
    const sortedActivities = dao.sort(activities, "startingAt");

    return sortedActivities;
}

export async function getAllActivities(options = {}) { 
    let filters = [];
    
    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }

    if (Object.hasOwn(options, "after")) {
        const after = utils.toFireStoreTime(options.after);
        filters.push(where("startingAt", ">=", after));
    }

    if (Object.hasOwn(options, "before")) {
        const before = utils.toFireStoreTime(options.before);
        filters.push(where("startingAt", "<=", before));
    }
    
    const allActivities = await dao.getSubCollections(dao.constant.ACTIVITIES, filters);
    const sortedActivities = dao.sort(allActivities, "startingAt");

    // Can get parent from the activity, but might decide to duplicate booking data into the activity instead
    // for (const activity of allActivities) {
    //     const ref = activity.ref;
    //     const parent = ref.parent;
    //     const parentId = parent.id; 
    //     const grandparent = parent.parent;
    //     const grandparentId = grandparent.id;
    //     const bookingDoc = await getDoc(grandparent);
    //     const bookingData = doc.data();
    //     let x = 1;
    // }    
    
    return sortedActivities;
}

export async function remove(bookingId, activityId, onError) {
    return await dao.remove([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, onError);
}

export async function getDishes(bookingId, mealId, filterOptions = {}) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, dao.constant.DISHES];
    return await dao.get(path, []);
}

export async function getOne(bookingId, id) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];
    return await dao.getOne(path, id);
}

// doesn't work yet. see dao.getOneFromSubCollections
// export async function getOneFromAnyBooking(id) {
//     return await dao.getOneFromSubCollections(dao.constant.ACTIVITIES, id);
// }

export async function getTypes(filterOptions = {}) {
    let filters = [];

    if (Object.hasOwn(filterOptions, "category")) {
        filters.push(where("category", "==", filterOptions.category));
    }

    if (Object.hasOwn(filterOptions, "subCategory")) {
        filters.push(where("subCategory", "==", filterOptions.subCategory));
    }

    let activityTypes = [];
    try {
        activityTypes = await dao.get([dao.constant.ACTIVITY_TYPES], filters); 
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }

    if(Object.hasOwn(filterOptions, 'house')) {
        activityTypes = activityTypes.filter(item => item.houseAvailability.includes(filterOptions.house));
    }

    return activityTypes;
}
