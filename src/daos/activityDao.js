import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js"
import * as utils from "../utils.js";

const getActivitiesPath = (bookingId) => {
    return [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];;
}

const getDishesPath = (bookingId, mealId) => {
    return [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, "dishes"];
}

export async function add(bookingId, activityId, activity, onError, writes = []) {
    const path = getActivitiesPath(bookingId);
    return await dao.add(path, activityId, activity, onError, writes);
}

export async function update(bookingId, activityId, activityData, updateLogs = true, onError = null, writes = []) {
    const path = getActivitiesPath(bookingId);
    return await dao.update(path, activityId, activityData, updateLogs, onError, writes);
}

export async function addDish(bookingId, mealId, dishId, dish, onError, writes = []) { 
    const path = getDishesPath(bookingId, mealId);
    return await dao.add(path, dishId, dish, onError, writes);
}

export async function deleteDish(bookingId, mealId, dishId, onError, writes = []) { 
    const path = getDishesPath(bookingId, mealId);
    return await dao.remove(path, dishId, onError, writes);
}

export async function updateDish(bookingId, mealId, dishId, dish, onError, writes = []) {
    const path = getDishesPath(bookingId, mealId);
    return await dao.update(path, dishId, dish, true, onError, writes);
}

export async function addPhoto(bookingId, activityId, id, data, onError, writes = []) {
    const path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, activityId, "activity-photos"];
    return await dao.add(path, id, data, onError, writes);
}

export async function getPhotos(bookingId, activityId, onError) {
    const path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, activityId, "activity-photos"];
    return await dao.get(path, [], [], -1, onError);
}

export async function removePhoto(bookingId, activityId, id, onError, writes = []) {
    const path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, activityId, "activity-photos"];
    return await dao.remove(path, id, onError, writes);
}

export async function getProviders(category, subCategory) {
    let filters = [
        where("category",    category   ),
        where("subCategory", subCategory)
    ];

    const providers = await dao.get([dao.constant.ACTIVITY_TYPES], filters);
    return providers;
}

// mealCategory = "breakfast", "lunch", "dinner", "snack", "afternoon tea", "floating breakfast"
export async function getMeals(bookingId, options = {}) {  
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];
    let filters = [];

    if(!utils.exists(options, "category")) {
        options.category = "meal";
    }

    // startingAt is a string in the format YYYY-MM-DD, without time
    if (utils.exists(options, "startingAt")) {
        filters.push(where("startingAt", "==", utils.toFireStoreTime(options.startingAt)));
    }

    if (utils.exists(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (utils.exists(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }
    
    const meals = await dao.get(path, filters);
    const sortedMeals = dao.sort(meals, "startingAt");

    return sortedMeals;
}

export async function getBookingActivities(bookingId, options = {}) { 
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES];

    let filters = [];
    
    if (utils.exists(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (utils.exists(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }

    if (utils.exists(options, "after")) {
        filters.push(where("startingAt", ">=", utils.toFireStoreTime(options.after)));
    }

    if (utils.exists(options, "before")) {
        filters.push(where("startingAt", "<=", utils.toFireStoreTime(options.before)));
    }

    if (utils.exists(options, "assignedTo")) {
        filters.push(where("assignedTo", "==", options.assignedTo));
    }

    if (utils.exists(options, "hasProvider")) {
        filters.push(where("provider", options.hasProvider ? "!=" : "==", ""));
    }

    const activities = await dao.get(path, filters, [], -1);
    const sortedActivities = dao.sort(activities, "startingAt");

    return sortedActivities;
}

export async function getAllActivities(options = {}, onError) { 
    let filters = [];
    
    if (utils.exists(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (utils.exists(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }

    if (utils.exists(options, "after")) {
        const after = utils.toFireStoreTime(options.after);
        filters.push(where("startingAt", ">=", after));
    }

    if (utils.exists(options, "before")) {
        const before = utils.toFireStoreTime(options.before);
        filters.push(where("startingAt", "<=", before));
    }
    
    const allActivities = await dao.getSubCollections(dao.constant.ACTIVITIES, filters, [], onError);
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

export async function remove(bookingId, activityId, onError, writes = []) {
    return await dao.remove([dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES], activityId, onError, writes);
}

export async function getMealDishes(bookingId, mealId, filterOptions = {}) {
    let path = [dao.constant.BOOKINGS, bookingId, dao.constant.ACTIVITIES, mealId, dao.constant.DISHES];
    let filters = [];

    if (utils.exists(filterOptions, "isFree")) {
        filters.push(where("isFree", "==", filterOptions.isFree));
    }
    
    return await dao.get(path, filters, [], -1);
}

export async function getDishes(filterOptions = {}, onError) {
    ;
    let filters = [];

    if (utils.exists(filterOptions, "isFree")) {
        filters.push(where("isFree", "==", filterOptions.isFree));
    }

    if (utils.exists(filterOptions, "name")) {
        filters.push(where("name", "==", filterOptions.name));
    }

    if (utils.exists(filterOptions, "after")) {
        const after = utils.toFireStoreTime(filterOptions.after);
        filters.push(where("createdAt", ">=", after));
    }

    if (utils.exists(filterOptions, "before")) {
        const before = utils.toFireStoreTime(filterOptions.before);
        filters.push(where("createdAt", "<=", before));
    }

    const ordering = [ orderBy("createdAt", "asc") ];

    const dishes = await dao.getSubCollections(dao.constant.DISHES, filters, ordering, onError);

    const dishesWithParent = await Promise.all(dishes.map(async (dish) => {
        const parent = await dao.getParent(dish);
        return {
            ...dish,      
            parent: parent,
        };
    }));
    
    return dishesWithParent;
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

    if (utils.exists(filterOptions, "category")) {
        filters.push(where("category", "==", filterOptions.category));
    }

    if (utils.exists(filterOptions, "subCategory")) {
        filters.push(where("subCategory", "==", filterOptions.subCategory));
    }

    let activityTypes = [];
    try {
        activityTypes = await dao.get([dao.constant.ACTIVITY_TYPES], filters, [], -1); 
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }

    if(utils.exists(filterOptions, 'house')) {
        activityTypes = activityTypes.filter(item => item.houseAvailability.includes(filterOptions.house));
    }

    return activityTypes;
}
