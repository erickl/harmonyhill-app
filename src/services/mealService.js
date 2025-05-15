import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as userService from "./userService.js";

export async function getMealCategories() {
    return await activityDao.getMealCategories();
}

export async function addMeal(bookingId, mealData) {
    const booking = await bookingDao.getOne(bookingId);
    if(!booking) {
        console.error(`Booking ${bookingId} not found`);
        return false;
    }

    const meal = mapMealObject(mealData);
    const mealId = makeMealId(meal.serveAt, booking.house, meal.subCategory);
    const success = await activityDao.add(bookingId, mealId, meal);
    return success ? mealId : false;
}

// Example result: 250530-hh-breakfast
export function makeMealId(serveAt, house, mealCategory) {
    const houseShort = house == "Harmony Hill" ? "hh" : "jn";
    serveAt = serveAt.replace(/-/g, "");
    return `${serveAt}-${houseShort}-${mealCategory.replace(/ /g, "-")}`;
}

// Example result: 250530-hh-breakfast-lentil-bolo
export function makeMealItemId(serveAt, house, mealCategory, mealItemName) {
    const mealId = makeMealId(serveAt, house, mealCategory);
    return `${mealId}-${mealItemName.replace(/ /g, "-")}`;
}

export async function addMealItems(bookingId, mealId, mealItemsData) {
    const booking = await bookingDao.getOne(bookingId, mealId);
    if(!booking) {
        console.error(`Booking ${bookingId} not found`);
        return false;
    }

    const meal = await activityDao.getOne(bookingId, mealId);
    if(!meal) {
        console.error(`Meal ${bookingId}/${mealId} not found`);
        return false;
    }

    let mealItems = [];   
    for(const mealItemData of mealItemsData) {
        mealItem = mapMealItemObject(mealItemData);
        const mealItemId = makeMealItemId(meal.serveAt, booking.house, meal.subCategory, mealItem.name);
        const success = await activityDao.addMealItem(bookingId, mealId, mealItemId, mealItem);
        if(!success) {
            return false;
        }
        mealItems.push(mealItemId);
    }
    return mealItems;
}

export async function update(bookingId, mealId, mealUpdateData) {
    const mealUpdate = mapMealObject(mealUpdateData, true);

    // Remove any fields which should not be updated
    if(Object.hasOwn(mealUpdateData, "createdAt")) {
        delete mealUpdateData.createdAt;
    }
    if(Object.hasOwn(mealUpdateData, "createdBy")) {
        delete mealUpdateData.createdBy;
    }

    return await activityDao.update(bookingId, mealId, mealUpdateData);
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
    const meal = await activityDao.get(bookingId, mealId);
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

function mapMealObject(mealData, isUpdate = false) {
    let meal = {};

    if(Object.hasOwn(mealData, "category"))   meal.category   = mealData.category;
    if(Object.hasOwn(mealData, "subCategory")) meal.subCategory = mealData.subCategory;
    if(Object.hasOwn(mealData, "serveAt"))     meal.serveAt     = mealData.serveAt;
    if(Object.hasOwn(mealData, "serveTime"))   meal.serveTime   = mealData.serveTime;
    if(Object.hasOwn(mealData, "status"))      meal.status      = mealData.status;

    if(!isUpdate) {
        meal.createdAt = new Date();
        meal.createdBy = userService.getUserName();
    }

    return meal;
}

function mapMealItemObject(mealItemData, isUpdate = false) {
    let meal = {};

    if(Object.hasOwn(mealItemData, "name"))     meal.name     = mealItemData.name;
    if(Object.hasOwn(mealItemData, "quantity")) meal.quantity = mealItemData.quantity;
    if(Object.hasOwn(mealItemData, "price"))    meal.price    = mealItemData.price;

    if(!isUpdate) {
        meal.createdAt = new Date();
        meal.createdBy = userService.getUserName();
    }

    return meal;
}

export async function testMeal() {
    const bookingId = "Eric-Klaesson-Harmony-Hill-251010";

    const mealCategory = "breakfast";
    const mealId = await addMeal(bookingId, {
        category: "meal",
        subCategory: mealCategory,
        serveAt: "2025-10-10",
        serveTime: "08:00",
        status: "confirmed",
        orderedAt: new Date(),
    });

    const mealIds = await addMealItems(bookingId, mealId, [{
        name: "Wingko Waffle",
        price: 100,
        quantity: 2,
    },{
        name: "Fruit Salad",
        price: 50,
        quantity: 1,
    }]);

    let x = 1;
}
