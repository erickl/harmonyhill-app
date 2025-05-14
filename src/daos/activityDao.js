import { where } from 'firebase/firestore';
import * as dao from "./dao.js"

// All meals for all bookings
//const mealsQuery = query(collectionGroup(db, "activities"), where("category", "==", "meal"));

export async function add(bookingId, activityId, activity) {
    return await dao.add(["bookings", bookingId, "activities"], activityId, activity);
}

export async function update(bookingId, activityId, activityData) {
    return await dao.update(["bookings", bookingId, "activities"], activityId, activityData);
}

export async function addMealItem(bookingId, mealId, mealItemId, mealItem) { 
    return await dao.add(["bookings", bookingId, "activities", mealId, "mealItems"], mealItemId, mealItem);
}

// Update meal item not existing. Only delete and add a new one
//export async function updateMealItem(bookingId, mealId, mealItemId, mealItem) {

export async function deleteMealItem(bookingId, mealId, mealItemId) { 
    return await dao.deleteDoc(["bookings", bookingId, "activities", mealId, "mealItems"], mealItemId);
}

// Only delete the whole meal if all mealItems are deleted first
export async function deleteMeal(bookingId, mealId) {
    const mealItems = await dao.get(["bookings", bookingId, "activities", mealId,  "mealItems"]);
    if(mealItems.length === 0) {
        return await dao.delete(["bookings", bookingId, "activities", mealId, "mealItems"], mealItemId);  
    }
    return false;
}

// mealCategory = "breakfast", "lunch", "dinner", "snack", "afternoon tea", "floating breakfast"
export async function getMeals(bookingId, options = {}) {   
    if(!Object.hasOwn(options, "category")) {
        options.category = "meal";
    }

    const activities = await getActivities(bookingId, options);
    return activities;
}

// mealCategory = "breakfast", "lunch", "dinner", "snack", "afternoon tea", "floating breakfast"
export async function getActivities(bookingId, options = {}) {   
    let filters = [];
    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }

    // ServeAt is a string in the format YYYY-MM-DD, without time
    if (Object.hasOwn(options, "serveAt")) {
        let yyyyMMdd = options.serveAt.getFullYear() + "-" + (options.serveAt.getMonth() + 1) + "-" + options.serveAt.getDate();
        filters.push(where("serveAt", "==", yyyyMMdd));
    }

    // serveAt is a string with format "YYYY-MM-DD"
    if (Object.hasOwn(options, "date")) {
        filters.push(where("date", "==", options.date));
    }

    let path = ["bookings", bookingId, "activities"];
    return await dao.get(path, filters);
}

export async function getMealItems(bookingId, mealId, filterOptions = {}) {
    let path = ["bookings", bookingId, "activities", mealId, "mealItems"];
    return await dao.get(path, []);
}

export async function get(bookingId, filterOptions = {}) {
    let path = ["bookings", bookingId, "activities"];
    return await dao.get(path, []);
}

export async function getOne(bookingId, id) {
    let path = ["bookings", bookingId, "activities"];
    return await dao.getOne(path, id);
}

export async function getMealCategories() {
    return await dao.get(["mealCategories"]); 
}
