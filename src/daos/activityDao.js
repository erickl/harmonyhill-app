import { where } from 'firebase/firestore';
import * as dao from "./dao.js"

// All meals for all bookings
//const mealsQuery = query(collectionGroup(db, dao.constant.ACTIVITIES), where("category", "==", "meal"));

export async function add(bookingId, activityId, activity) {
    return await dao.add([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, activity);
}

export async function update(bookingId, activityId, activityData) {
    return await dao.update([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, activityData);
}

export async function addMealItem(bookingId, mealId, mealItemId, mealItem) { 
    return await dao.add([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "mealItems"], mealItemId, mealItem);
}

// Update meal item not existing. Only delete and add a new one
//export async function updateMealItem(bookingId, mealId, mealItemId, mealItem) {

export async function deleteMealItem(bookingId, mealId, mealItemId) { 
    return await dao.deleteDoc([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "mealItems"], mealItemId);
}

// Only delete the whole meal if all mealItems are deleted first
export async function deleteMeal(bookingId, mealId) {
    const mealItems = await dao.get([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId,  "mealItems"]);
    if(mealItems.length === 0) {
        return await dao.remove([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "mealItems"], mealItemId);  
    }
    return false;
}

// mealCategory = "breakfast", "lunch", "dinner", "snack", "afternoon tea", "floating breakfast"
export async function getMeals(bookingId, options = {}) {  
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];

    if(!Object.hasOwn(options, "category")) {
        options.category = "meal";
    }

    // serveAt is a string in the format YYYY-MM-DD, without time
    if (Object.hasOwn(options, "serveAt")) {
        filters.push(where("serveAt", "==", options.serveAt));
    }

    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }
    
    let ordering = [ orderBy("serveAt", "asc") ];

    return await dao.get(path, filters, ordering);
}

export async function getActivities(bookingId, options = {}) { 
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];

    let filters = [];
    
    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }

    if (Object.hasOwn(options, "before")) {
        filters.push(where("date", ">=", options.before));
    }

    if (Object.hasOwn(options, "after")) {
        filters.push(where("date", "<=", options.after));
    }
    
    let ordering = [ orderBy("date", "asc") ];

    return await dao.get(path, filters, ordering);
}

export async function getMealItems(bookingId, mealId, filterOptions = {}) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "mealItems"];
    return await dao.get(path, []);
}

export async function get(bookingId, filterOptions = {}) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];
    return await dao.get(path, []);
}

export async function getOne(bookingId, id) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];
    return await dao.getOne(path, id);
}

export async function getMealCategories() {
    return await dao.get([dao.constant.MEAL_CATEGORIES]); 
}
