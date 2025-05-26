import * as mealService from './mealService.js';
import * as activityService from './activityService.js';
import * as storage from "../daos/storage.js";

/**
 * @param {*} bookingId 
 * @returns json with itemized list of all a booking's activities and the total amount owed 
 */
export async function getTotal(bookingId) {
    const activities = await activityService.get(bookingId);
    
    const itemizedList = await Promise.all(
        activities.map(async function(activity) {
            let activityItem = {
                name: activity.category + ": " + activity.subCategory,
                price: activity.price,
                date: activity.startingAt
            }
            if(activity.category === "meal") {
                const mealItems = await mealService.getMealItems(bookingId, activity.id);
                activityItem.mealItems = mealItems;
            }
            return activityItem;
        })
    );

    const totalSum = itemizedList.reduce((sum, item) => sum + item.price, 0);

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
