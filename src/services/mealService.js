import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";

export async function getMealCategories() {
    return await activityDao.getMealCategories();
}

export async function addMeal(bookingId, mealData) {
    const booking = await bookingDao.getOne(bookingId);
    if(!booking) {
        console.error(`Booking ${bookingId} not found`);
        return false;
    }

    const mealId = makeMealId(mealData.serveAt, booking.house, mealData.subCategory);
    const success = await activityDao.add(bookingId, mealId, mealData);
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
    for(const item of mealItemsData) {
        const mealItemId = makeMealItemId(meal.serveAt, booking.house, meal.subCategory, item.name);
        const success = await activityDao.addMealItem(bookingId, mealId, mealItemId, item);
        if(!success) {
            return false;
        }
        mealItems.push(mealItemId);
    }
    return mealItems;
}

export async function update(bookingId, mealId, mealData) {
    return await activityDao.update(bookingId, mealId, mealData);
}

/**
 * @param {Object} options
 * house=Harmony Hill|Jungle Nook,
 * date=Date object (new Date(...))
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

export async function testMeal() {
    const bookingId = "Eric-Klaesson-Harmony-Hill-251010";
    const house = "Harmony Hill";

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
