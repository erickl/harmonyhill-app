import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";

async function addMeal(bookingRef, mealData) {
    const success = await activityDao.add(bookingRef, mealData);
    return success;
}

async function addMealItems(bookingRef, mealRef, mealItemsData) {
    const success = await activityDao.addMealItem(bookingRef, mealData);
    return success;
}

async function update(bookingRef, mealRef, mealData) {
    const success = await activityDao.update(bookingRef, mealRef, mealData);
    return success;
}

async function getMeals(options) {
    const bookings = await bookingDao.filter(options);
    let meals = [];
    for(const booking of bookings) {
        const bookingRef = booking.id;
        const meal = await activityDao.getMeals(bookingRef, options);
        meals.push(meal);
    }
   
    return meals;
}

async function getMeal(bookingRef, mealRef) {
    const meal = await activityDao.getMeal(bookingRef, mealRef);
    return meal;
}

async function getMealsByBooking(bookingRef, options = {}) {
    const meals = await activityDao.getMeals(bookingRef, options);
    return meals;
}

async function getMealItems(bookingRef, mealRef) {
    const mealItems = await activityDao.getMealItems(bookingRef, mealRef);
    return mealItems;
}
