import * as mealService from './mealService.js';
import * as activityService from './activityService.js';
import * as utils from "../utils.js";

/**
 * @param {*} bookingId 
 * @returns json with itemized list of all a booking's activities and the total amount owed 
 */
export async function getTotal(bookingId) {
    const activities = await activityService.get(bookingId);
    
    // Get all meals, even with customerPrice = 0, because the dish prices are no longer summed up at meal level (since 2025-12)
    const meals = activities.filter(activity => activity.category === "meal");
    const nonFreeActivities = activities.filter(activity => activity.category !== "meal" && activity.isFree === false && activity.customerPrice > 0);
    
    const itemizedMealList = await Promise.all(
        meals.map(async function(meal) {
            let mealItem = {
                name:          meal.category + ": " + meal.subCategory,
                displayName:   meal.displayName,
                customerPrice: meal.customerPrice,
                date:          meal.startingAt,
                isFree:        meal.isFree
            }
            
            // E.g. even though a whole breakfast can be free, it can still include non-free, extra items
            const dishes = await mealService.getMealDishes(bookingId, meal.id, {"isFree" : false});
            mealItem.dishes = dishes;
            // Todo: should the meal total be displayed on meal level?
            mealItem.customerPrice += dishes.reduce((sum, dish) => dish.isFree === true ? 0 : sum + dish.customerPrice, 0);
            
            return mealItem;  
        })
    );

    const itemizedActivityList = nonFreeActivities.map((activity) => {
        let activityItem = {
            name:          activity.category + ": " + activity.subCategory,
            displayName:   activity.displayName,
            customerPrice: activity.customerPrice,
            date:          activity.startingAt,
            isFree:        activity.isFree
        }
        
        return activityItem;  
    });

    const totalActivitySum = itemizedActivityList.reduce((sum, item) => {
        const itemCost = item && item.isFree !== true && !utils.isEmpty(item.customerPrice) ? item.customerPrice : 0;
        return sum + itemCost;
    }, 0);

    const totalMealSum = itemizedMealList.reduce((sum, item) => {
        const mealCost = item && !item.isFree && !utils.isEmpty(item.customerPrice) ? item.customerPrice : 0;
        //const dishesCost = item.dishes.reduce((sum, dish) => dish && dish.isFree !== true && !utils.isEmpty(dish.customerPrice) ? sum + dishCost : 0, 0);
        return sum + mealCost;// + dishesCost;
    }, 0);

    const totalList = [...itemizedActivityList, ...itemizedMealList];

    return {
        total        : totalMealSum + totalActivitySum,
        itemizedList : totalList
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
