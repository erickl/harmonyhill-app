import * as mealService from './mealService.js';
import * as activityService from './activityService.js';
import * as storage from "../daos/storage.js";
import * as utils from "../utils.js";

/**
 * @param {*} bookingId 
 * @returns json with itemized list of all a booking's activities and the total amount owed 
 */
export async function getTotal(bookingId) {
    const activities = await activityService.get(bookingId);
    
    const itemizedList = await Promise.all(
        activities.map(async function(activity) {
            let activityItem = {
                name:          activity.category + ": " + activity.subCategory,
                customerPrice: activity.customerPrice,
                date:          activity.startingAt,
                isFree:        activity.isFree
            }
            if(activity.category === "meal") {
                const dishes = await mealService.getDishes(bookingId, activity.id);
                activityItem.dishes = dishes;
            }
            return activityItem;
        })
    );

    const totalSum = itemizedList.reduce((sum, item) => {
        const itemCost = !item.isFree && !utils.isEmpty(item.customerPrice) ? item.customerPrice : 0;
        return sum + itemCost;
    }, 0);

    return {
        total: totalSum,
        itemizedList : itemizedList
    }
}

export async function createCsvInvoice(bookingId) {
    // todo
}

/**
 * Upload invoice for purchases for your business (e.g. of market groceries, construction materials, etc...)
 * @param {*} filename 
 * @param {*} image 
 */
export async function uploadPurchaseInvoice(filename, image) {
    return await storage.uploadImage(filename, image);
}

export async function testInvoice() {
    const bookingId = "YLtShKoNq3jQup9sh5Ws";
    const itemizedInvoice = await getTotal(bookingId);

    let x = 1;
}

// Create a description like this "1x Bolognese (free, no spicy)" 
export function dishReceiptLine(dishData) {
    const dishItem = `${dishData.quantity}x ${dishData.name}`;

    let dishComments = "";
    if(dishData.isFree === true) {
        dishComments += "free";
    }
    if(utils.isString(dishData.comments)) {
        if(dishData.isFree) dishComments += ", "; 
        dishComments += dishData.comments.trim();
    }
    if(dishComments.length > 0) {
        dishComments = ` (${dishComments})`;
    }
    
    return dishItem + dishComments;
}
