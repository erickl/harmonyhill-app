import * as mealService from './mealService.js';
import * as activityService from './activityService.js';
import * as utils from "../utils.js";

/**
 * @param {*} bookingId 
 * @returns json with itemized list of all a booking's activities and the total amount owed 
 */
export async function getTotal(bookingId) {
    const activities = await activityService.get(bookingId);
    const nonFreeActivities = activities.filter(activity => !activity.isFree && activity.customerPrice > 0);
    
    const itemizedList = await Promise.all(
        nonFreeActivities.map(async function(activity) {
            let activityItem = {
                name:          activity.category + ": " + activity.subCategory,
                displayName:   activity.displayName,
                customerPrice: activity.customerPrice,
                date:          activity.startingAt,
                isFree:        activity.isFree
            }
            if(activity.category === "meal") {
                // E.g. even though a whole breakfast can be free, it can still include non-free, extra items
                const filters = {"isFree" : false};
                const dishes = await mealService.getMealDishes(bookingId, activity.id, filters);
                activityItem.dishes = dishes;
            }
            return activityItem;  
        })
    );

    const totalSum = itemizedList.reduce((sum, item) => {
        const itemCost = item && !item.isFree && !utils.isEmpty(item.customerPrice) ? item.customerPrice : 0;
        return sum + itemCost;
    }, 0);

    return {
        total        : totalSum,
        itemizedList : itemizedList
    }
}

export async function createCsvInvoice(bookingId) {
    // todo
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
