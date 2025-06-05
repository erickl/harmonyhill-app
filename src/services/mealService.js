import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as userService from "./userService.js";
import * as utils from "../utils.js";

export async function getMealCategories() {
    return await activityDao.getTypes("meal");
}

export async function addMeal(bookingId, mealData) {
    const booking = await bookingDao.getOne(bookingId);
    if(!booking) {
        console.error(`Booking ${bookingId} not found`);
        return false;
    }

    const meal = await mapMealObject(mealData);
    const mealId = makeMealId(meal.startingAt, booking.house, meal.subCategory);
    const success = await activityDao.add(bookingId, mealId, meal);
    return success ? mealId : false;
}

// Example result: 250530-hh-breakfast
export function makeMealId(startingAt, house, mealCategory) {
    const houseShort = house == "Harmony Hill" ? "hh" : "jn";
    startingAt = startingAt.replace(/-/g, "");
    return `${startingAt}-${houseShort}-${mealCategory.replace(/ /g, "-")}`;
}

// Example result: 250530-hh-breakfast-lentil-bolo
export function makeMealItemId(startingAt, house, mealCategory, mealItemName) {
    const mealId = makeMealId(startingAt, house, mealCategory);
    return `${mealId}-${mealItemName.replace(/ /g, "-")}`;
}

export async function addMealItems(bookingId, mealId, mealItemsData) {
    // Get booking
    const booking = await bookingDao.getOne(bookingId, mealId);
    if(!booking) {
        console.error(`Booking ${bookingId} not found`);
        return false;
    }

    // Get meal
    const meal = await activityDao.getOne(bookingId, mealId);
    if(!meal) {
        console.error(`Meal ${bookingId}/${mealId} not found`);
        return false;
    }

    // Add each meal item
    let mealItems = [];   
    for(const mealItemData of mealItemsData) {
        const mealItem = await mapMealItemObject(mealItemData);
        const mealItemId = makeMealItemId(meal.startingAt, booking.house, meal.subCategory, mealItem.name);
        
        // Atomic transaction: either both DB updates happen, or none does
        const transactionSuccess = await activityDao.transaction(async () => {
            // Add meal item to the meal
            const success1 = await activityDao.addMealItem(bookingId, mealId, mealItemId, mealItem);
            if(!success1) {
                throw new Error("Cannot add meal item");
            }
            // Update the meal total price
            const success2 = await update(bookingId, mealId, { price: meal.price + mealItem.price });
            if(!success2) {
                throw new Error("Cannot update total meal price");
            }
        });
        if(transactionSuccess) {
            mealItems.push(mealItemId);
        }
    }
    return mealItems;
}

export async function update(bookingId, mealId, mealUpdateData) {
    const mealUpdate = await mapMealObject(mealUpdateData, true);
    return await activityDao.update(bookingId, mealId, mealUpdate);
}

/**
 * @param {Object} options filters for the meal data
 *      house=Harmony Hill|Jungle Nook,
 *      date=Date object (new Date(...))
 */
export async function getMeals(options) {
    const bookings = await bookingDao.get(options);
    let meals = [];
    for(const booking of bookings) {
        const bookingId = booking.id;
        const meal = await activityDao.getMeals(bookingId, options);
        meals.push(meal);
    }
    return meals;
}

export async function getMeal(bookingId, mealId) {
    const meal = await activityDao.getOne(bookingId, mealId);
    return meal;
}

export async function getMealsByBooking(bookingId, options = {}) {
    const meals = await activityDao.getMeals(bookingId, options);
    return meals;
}

export async function getMealItems(bookingId, mealId) {
    const mealItems = await activityDao.getMealItems(bookingId, mealId);
    return mealItems;
}

export async function deleteMealItem(bookingId, mealId, mealItemId) {
    return await activityDao.deleteMealItem(bookingId, mealId, mealItemId);
}

async function mapMealObject(mealData, isUpdate = false) {
    let meal = {};

    meal.category = utils.isString(mealData?.category) ? mealData.category : "meal";

    if(utils.isString(mealData?.subCategory)) meal.subCategory = mealData.subCategory;

    if(utils.isDate(mealData?.startingAt)) {
        meal.startingAt = mealData.startingAt;
    }

    if(utils.isString(mealData?.status)) meal.status = mealData.status;

    if(!isUpdate) {
        meal.createdAt = new Date();
        meal.createdBy = await userService.getUserName();
    }

    return meal;
}

async function mapMealItemObject(mealItemData, isUpdate = false) {
    let meal = {};

    if(utils.isString(mealItemData?.name))     meal.name     = mealItemData.name;
    if(utils.isNumber(mealItemData?.quantity)) meal.quantity = mealItemData.quantity;
    if(utils.isAmount(mealItemData?.price))    meal.price    = mealItemData.price;

    if(!isUpdate) {
        meal.createdAt = new Date();
        meal.createdBy = await userService.getUserName();
    }

    return meal;
}

export async function testMeal() {
    const bookingId = "Eric-Klaesson-Harmony-Hill-251010";

    const mealCategory = "breakfast";
    const mealId = await addMeal(bookingId, {
        category: "meal",
        subCategory: mealCategory,
        startingAt: "2025-10-10",
        serveTime: "08:00",
        status: "confirmed",
        orderedAt: new Date(),
    });

    const mealItemIds = await addMealItems(bookingId, mealId, [{
        name: "Wingko Waffle",
        price: 100,
        quantity: 2,
    },{
        name: "Fruit Salad",
        price: 50,
        quantity: 1,
    }]);

    const meal = await getMeal(bookingId, mealId);
    if(!meal) {
        return false;
    }
    if(meal.price !== 150) {
        return false;
    }

    const returnedMealItems = await getMealItems(bookingId, mealId);
    const wingkoMealItem = returnedMealItems.find(mealItem => mealItem.name === "Wingko Waffle");

    let x = 1;
}
