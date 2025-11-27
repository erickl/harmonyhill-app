import * as menuService from "./menuService.js";
import * as activityService from "./activityService.js";
import * as mealService from "./mealService.js";
import * as bookingDao from "../daos/bookingDao.js";
import {getCurrent as getCurrentBookings} from "./bookingService.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit, getParent} from "../daos/dao.js";

export async function addOrEdit(activity, minibar, onError, writes = []) {
    const commit = decideCommit(writes);

    const filteredItems = filterZeroCounts(minibar.items);
    const minibar_ = {...minibar, items: filteredItems};

    let result = false;

    const existing = await bookingDao.getExistingMinibar(minibar_, onError);

    if(existing !== null) {
        result = await bookingDao.updateMinibar(activity.bookingId, existing.id, minibar_, onError, writes);
    } else {
        result = await bookingDao.addMinibar(activity, minibar_, onError, writes);
    }

    if(result === false) return false;

    // If this is the end count, create a "minibar meal" activity, which will count as a final minibar sale 
    if(minibar_.type === "end") { 
        const booking = await getParent(activity);
        if(!booking) return false;
        result = await addOrEditMinibarSale(booking, onError, writes);
        if(result === false) return false;
    }

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

async function addOrEditMinibarSale(booking, onError, writes = []) {
    const itemsSold = await calculateSale(booking, onError);
    if(itemsSold === false) return false;

    const dishes = [];

    // Take each minibar item from inventory
    for(const [name, quantity] of Object.entries(itemsSold)) {
        if(quantity > 0) {
            const dish = await menuService.getOneByNameAndCourse(name, "minibar");
            if(!dish) {
                return onError(`Minibar item ${name} doesn't exist in our records. Contact admin, please`);
            }
           
            dish.quantity = quantity;
            dishes.push(dish);
        }
    }

    let result = false;

    const existingMinibarMeals = await activityService.get(booking.id, {subCategory: "minibar"}, onError);
    
    if(existingMinibarMeals === false || !existingMinibarMeals || existingMinibarMeals.length === 0) {
        const minibarTypeInfo = await activityService.getActivityType("meal", "minibar");
        const minibarActivity = activityService.getInitialActivityData(minibarTypeInfo);
        minibarActivity.dishes = dishes;
        result = await mealService.addMeal(booking.id, minibarActivity, onError, writes);
    } else {
        const existingMinibarMeal = existingMinibarMeals[0];
        existingMinibarMeal.dishes = dishes;
        result = await mealService.update(booking.id, existingMinibarMeal.id, existingMinibarMeal, onError, writes);
    }
       
    if(result === false) return false;
    return result;
}

export async function calculateSale(booking, onError) {
    const startCount = await getCount(booking, "start", onError);
    if(!startCount) {
        return onError(`No start count found for booking ${booking.id}`);
    }

    const totalRefills = await getTotalRefills(booking, onError);

    const endCount = await getCount(booking, "end", onError);
    if(!endCount) {
        return onError(`No end count found for booking ${booking.id}`);
    }
    
    const totalProvided = startCount.items;
    Object.entries(totalRefills).forEach(([name, quantity]) => {
        totalProvided[name] = utils.exists(totalProvided, name) ? totalProvided[name] + quantity : quantity;
    });

    const sales = totalProvided;
    Object.entries(endCount.items).forEach(([name, quantity]) => {
        sales[name] = totalProvided[name] - quantity;
    });

    return sales;
}

/**
 * Return the number of reserved stock of the given inventory item name.
 * Reserved here means that the item is currently in the fridge of one of the villas
 * @param {*} name 
 * @param {*} onError 
 */
export async function getReservedStock(name, onError) {
    const bookings = await getCurrentBookings({}, onError);
    // get current bookings
    // for each booking, get the initial count + any refill
    // get current total inventory
    // see what's left
}

export async function getTotalRefills(booking, onError) {
    const refills = await get(booking, {"type": "refill"}, onError);

    const total = refills.reduce((map, refill) => {
        Object.entries(refill.items).forEach(([name, quantity]) => {
            map[name] = utils.exists(map, name) ? map[name] + quantity : quantity;  
        });
        return map;
    }, {});

    return total;
}

/**
 * @param {*} 
 * @param {*} filters type=sale|end|start|refill, activityId, bookingId
 * @param {*} onError 
 * @returns 
 */
export async function get(booking, filters, onError) {
    return await bookingDao.getMinibarCounts(booking.id, filters, onError);
}

export default async function getCount(booking, type, onError) {
    const startCounts = await get(booking, {"type": type}, onError);
    if(!startCounts || startCounts.length === 0) return null;
    return startCounts[0];
}

export async function removeCounts(activity, onError, writes = []) {
    const commit = decideCommit(writes);

    let result = true;

    const minibarCounts = await bookingDao.getMinibarCounts(activity.bookingId, {activityId : activity.id}, onError);
    for(const minibarCount of minibarCounts) {
        const removeMinibarCountResult = await bookingDao.removeMinibarCount(activity.bookingId, minibarCount.id, onError, writes);
        if(removeMinibarCountResult === false) return false;
    }

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function getSelection(onError) {
    const filter = { meal: "minibar" };
    const minibarSelection = await menuService.get(filter, onError);
    return minibarSelection;
}

/**
 * Filter out key-value pairs where the value is less than 1
 * @param {*} items a json object (a map with key-value pairs, where the value is a number)
 */
function filterZeroCounts(items) {
    const nonZeroItems = Object.entries(items).filter(([_, quantity]) => quantity > 0);
    return Object.fromEntries(nonZeroItems);
}
