import { where, orderBy, getDoc } from 'firebase/firestore';
import * as dao from "./dao.js"

export async function add(bookingId, activityId, activity) {
    return await dao.add([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, activity);
}

export async function update(bookingId, activityId, activityData) {
    return await dao.update([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, activityData);
}

export async function addMealItem(bookingId, mealId, mealItemId, mealItem) { 
    return await dao.add([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "mealItems"], mealItemId, mealItem);
}

export async function transaction(inTransaction) {
    return dao.transaction(inTransaction);
}

// Update meal item not existing. Only delete and add a new one
//export async function updateMealItem(bookingId, mealId, mealItemId, mealItem) {

export async function deleteMealItem(bookingId, mealId, mealItemId) { 
    return await dao.remove([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "mealItems"], mealItemId);
}

// Only delete the whole meal if all mealItems are deleted first
export async function deleteMeal(bookingId, mealId) {
    const mealItems = await dao.get([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId,  "mealItems"]);
    if(mealItems.length === 0) {
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
        filters.push(where("startingAt", "==", options.startingAt));
    }

    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }
    
    let ordering = [ orderBy("startingAt", "asc") ];

    return await dao.get(path, filters, ordering);
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
        filters.push(where("startingAt", "<=", options.after));
    } else {
        options.after = new Date();
        options.after.setHours(0, 0, 0, 0); // Set to start of the day
    }

    if (Object.hasOwn(options, "before")) {
        filters.push(where("startingAt", ">=", options.before));
    }

    if (Object.hasOwn(options, "assignedTo")) {
        filters.push(where("assignedTo", "==", options.assignedTo));
    }

    if (Object.hasOwn(options, "hasProvider")) {
        filters.push(where("provider", options.hasProvider ? "!=" : "==", ""));
    }
    
    let ordering = [ orderBy("startingAt", "asc") ];

    return await dao.get(path, filters, ordering);
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
        filters.push(where("startingAt", "<=", options.after));
    } else {
        options.after = new Date();
        options.after.setHours(0, 0, 0, 0); // Set to start of the day
    }

    if (Object.hasOwn(options, "before")) {
        filters.push(where("startingAt", ">=", options.before));
    }
    
    let ordering = [ orderBy("startingAt", "asc") ];

    const allActivities = await dao.getSubCollections(dao.constant.ACTIVITIES, filters, ordering);
 
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
    
    return allActivities;
}

export async function remove(bookingId, activityId) {
    return await dao.remove([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId);
}

export async function getMealItems(bookingId, mealId, filterOptions = {}) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "mealItems"];
    return await dao.get(path, []);
}

export async function getOne(bookingId, id) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];
    return await dao.getOne(path, id);
}

export async function getTypes(filterOptions = {}) {
    let filters = [];
    if (Object.hasOwn(filterOptions, "category")) {
        filters.push(where("category", "==", filterOptions.category));
    }

    return await dao.get([dao.constant.ACTIVITY_TYPES], filters); 
}
