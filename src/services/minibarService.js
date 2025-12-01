import * as menuService from "./menuService.js";
import * as activityService from "./activityService.js";
import * as mealService from "./mealService.js";
import * as userService from "./userService.js";
import * as bookingDao from "../daos/bookingDao.js";
import {getCurrent as getCurrentBookings} from "./bookingService.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit, getParent} from "../daos/dao.js";

export async function addOrEdit(activity, newMinibarEntry, onError, writes = []) {
    const commit = decideCommit(writes);

    const existing = await bookingDao.getExistingMinibar(newMinibarEntry, onError);

    const nonZeroItems = Object.entries(newMinibarEntry.items).filter(([name, quantity]) => {
        return (existing && existing.items[name] > 0) || quantity > 0;
    });
    const filteredItems = Object.fromEntries(nonZeroItems);

    const updatedMinibarEntry = {...newMinibarEntry, items: filteredItems};

    let result = false;

    if(existing !== null) {
        result = await bookingDao.updateMinibar(activity.bookingId, existing.id, updatedMinibarEntry, onError, writes);
    } else {
        result = await bookingDao.addMinibar(activity, updatedMinibarEntry, onError, writes);
    }

    if(result === false) return false;

    // If this is the end count, create a "minibar meal" activity, which will count as a final minibar sale 
    if(updatedMinibarEntry.type === "end") { 
        const booking = await getParent(activity);
        if(!booking) return false;
        result = await addOrEditMinibarSale(result, booking, onError, writes);
        if(result === false) return false;
    }

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

async function addOrEditMinibarSale(endCountEntry, booking, onError, writes = []) {
    const itemsSold = await calculateSale(endCountEntry, booking, onError);
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
        minibarActivity.startedAt = utils.now();
        minibarActivity.startedTime = utils.now();
        minibarActivity.assignedTo = await userService.getCurrentUserName();
        minibarActivity.assigneeAccept = true;
        minibarActivity.status = "completed";
        minibarActivity.dishes = dishes;
        result = await mealService.addMeal(booking.id, minibarActivity, onError, writes);
    } else if(existingMinibarMeals.length > 1) {
        return onError(`Booking ${booking.id} has ${existingMinibarMeals.length}/1 minibar meals`);
    } else {
        const existingMinibarMeal = existingMinibarMeals[0];
        existingMinibarMeal.dishes = dishes;
        result = await mealService.update(booking.id, existingMinibarMeal.id, existingMinibarMeal, onError, writes);
    }
       
    if(result === false) return false;
    return result;
}

export async function calculateSale(endCount, booking, onError) {
    const startCount = await getCount(booking, "start", onError);
    if(!startCount) {
        return onError(`No start count found for booking ${booking.id}`);
    }

    const totalRefills = await getTotalRefills(booking, onError);
    
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
 * Return the number of reserved stock for each item.
 * 'Reserved' here means that the item is currently in the fridge of one of the villas
 * @param {*} name 
 * @param {*} onError 
 */
export async function getReservedStock(filter, onError) {
    const exceptActivityId = utils.exists(filter, "exceptActivityId") ? filter.exceptActivityId : "";
    let reservedStock = {};
    const bookings = await getCurrentBookings(filter, onError);
    for(const booking of bookings) {
        const minibarCounts = await bookingDao.getMinibarCounts(booking.id, {}, onError);
        for(const minibarCount of minibarCounts) {
            // For current bookings, there should only be 'start' count and 'refill' counts (I.e. no 'end' counts)
            if(minibarCount.type !== "start" && minibarCount.type !== "refill") {
                continue;
            }
            if(minibarCount.activityId === exceptActivityId) {
                continue;
            }
            if(!minibarCount || !minibarCount.items || !utils.isJsonObject(minibarCount.items)) {
                continue;
            }
            for(const [name, quantity] of Object.entries(minibarCount.items)) {
                if(!utils.exists(reservedStock, name)) reservedStock[name] = 0;
                reservedStock[name] += quantity;
            }
        }
    }
    return reservedStock;
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

export async function getTotalProvided(booking, onError) {
    const total = await getTotalRefills(booking, onError);

    const startCount = await getCount(booking, "start", onError);

    Object.entries(startCount.items).forEach(([name, quantity]) => {
        if(!utils.exists(total, name)) total[name] = 0;
        total[name] += quantity;
    });
    
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

export async function getCount(booking, type, onError) {
    const counts = await get(booking, {"type": type}, onError);
    if(!counts || counts.length === 0) return null;
    return counts[0];
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
