import * as menuService from "./menuService.js";
import * as inventoryService from "./inventoryService.js";
import * as activityService from "./activityService.js";
import * as mealService from "./mealService.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit} from "../daos/dao.js";
import { activeAnimations } from "framer-motion";

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

    if(minibar_.type === "end") { 
        if(existing !== null) {
            result = await updateMinibarMeal(activity, onError, writes);
        } else {
            result = await addMinibarMeal(activity, onError, writes);
        }
    }

    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

async function addMinibarMeal(activity, onError, writes = []) {
    const itemsSold = await calculateSale(activity, onError);
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

    const minibarTypeInfo = await activityService.getActivityType("meal", "minibar");
    const minibarActivity = activityService.getInitialActivityData(minibarTypeInfo);
    minibarActivity.dishes = dishes;

    const result = await mealService.addMeal(activity.bookingId, minibarActivity, onError, writes);
    if(result === false) return false;

    return result;
}

async function updateMinibarMeal(activity, onError, writes = []) {
    const itemsSold = await calculateSale(activity, onError);
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

    activity.dishes = dishes;
    const updateMealResult = await mealService.update(activity.bookingId, activity.id, activity, onError, writes);
    if(updateMealResult === false) return false;
    
    return true;
}

export async function calculateSale(activity, onError) {
    const startCount = await getType(activity, "start", onError);
    if(!startCount) {
        return onError(`No start count found for booking ${activity.bookingId}`);
    }

    const totalRefills = await getTotalRefills(activity, onError);

    const endCount = await getType(activity, "end", onError);
    if(!endCount) {
        return onError(`No end count found for booking ${activity.bookingId}`);
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

export async function getTotalRefills(activity, onError) {
    const refills = await get(activity, {"type": "refill"}, onError);

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
export async function get(activity, filters, onError) {
    return await bookingDao.getMinibar(activity, filters, onError);
}

export default async function getType(activity, type, onError) {
    const startCounts = await get(activity, {"type": type}, onError);
    if(!startCounts || startCounts.length === 0) return null;
    return startCounts[0];
}

export async function remove(activity, onError, writes = []) {
    const commit = decideCommit(writes);
    
    const result = await bookingDao.removeMinibar(activity, onError);
    if(result === false) return false;

    const minibarMeal = await mealService.getMeal(activity.bookingId, activity.id, onError);
    if(minibarMeal) {
        const removeMinibarMealResult = await mealService.removeMeal(activity, onError, writes);
        if(removeMinibarMealResult === false) return false;
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
