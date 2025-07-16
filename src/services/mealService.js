import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as activityService from "./activityService.js";
import * as userService from "./userService.js";
import * as utils from "../utils.js";

export async function getMealCategories() {
    return await activityDao.getTypes({"category" : "meal"});
}

export async function addMeal(bookingId, mealData, onError) {
    const booking = await bookingDao.getOne(bookingId);
    if(!booking) {
        console.error(`Booking ${bookingId} not found`);
        return false;
    }

    const meal = await mapMealObject(mealData);
    const mealId = makeMealId(meal.startingAt, booking.house, meal.subCategory);
    const success = await activityDao.add(bookingId, mealId, meal, onError);
    if(!success) {
        // todo: pass onError to the add function
        return false; 
    }

    if(!utils.isEmpty(mealData.dishes)) {
        const returnedDishIds = await addMealItems(bookingId, mealId, Object.values(mealData.dishes), onError);
        if(returnedDishIds.length !== Object.keys(mealData.dishes).length) {
            //onError("Not all dishes were successfully uploaded");
            // todo: pass onError to the add function: not all dishes were successfully uploaded
            return false;
        }
    }

    return success ? mealId : false;
}

// Example result: 250530-hh-breakfast
export function makeMealId(startingAt, house, meal) {
    const houseShort = house.toLowerCase().trim() == "harmony hill" ? "hh" : "jn";
    startingAt = utils.to_YYMMdd(startingAt);
    return `${startingAt}-${houseShort}-${meal.replace(/ /g, "-")}`;
}

// Example result: 250530-hh-breakfast-lentil-bolo
export function makeMealItemId(startingAt, house, meal, mealItemName) {
    const mealId = makeMealId(startingAt, house, meal);
    return `${mealId}-${mealItemName.replace(/ /g, "-")}`;
}

export async function addMealItems(bookingId, mealId, mealItemsData, onError) {
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
    let runningTotalMealPrice = meal.price ? meal.price : 0;

    // Add each meal item
    let mealItems = [];   
    for(const mealItemData of mealItemsData) {
        const mealItem = await mapMealItemObject(mealItemData);
        const mealItemId = makeMealItemId(meal.startingAt, booking.house, meal.subCategory, mealItem.name);
        
        // Atomic transaction: either both DB updates happen, or none does
        const transactionSuccess = await activityDao.transaction(async () => {
            // Add meal item to the meal
            const addMealItemSuccess = await activityDao.addMealItem(bookingId, mealId, mealItemId, mealItem, onError);
            if(!addMealItemSuccess) {
                throw new Error("Cannot add meal item");
            }

            // Update the total meal price
            runningTotalMealPrice += !mealItem.isFree ? mealItem.price * mealItem.quantity : 0;
            const updateMealPriceSuccess = await activityDao.update(bookingId, mealId, { price: runningTotalMealPrice }, onError);
            if(!updateMealPriceSuccess) {
                throw new Error("Cannot update total meal price");
            }
        });

        if(transactionSuccess) {
            mealItems.push(mealItemId);
        }
    }
    return mealItems;
}

export async function update(bookingId, mealId, mealUpdateData, onError) {
    const mealUpdate = await mapMealObject(mealUpdateData, true);
    return await activityDao.update(bookingId, mealId, mealUpdate, onError);
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
        const enhancedMeal = activityService.enhanceActivities(meal);
        meals.push(enhancedMeal);
    }
    return meals;
}

export async function getMeal(bookingId, mealId) {
    const meal = await activityDao.getOne(bookingId, mealId);
    const enhancedMeal = activityService.enhanceActivities(meal); 
    return enhancedMeal;
}

export async function getMealsByBooking(bookingId, options = {}) {
    const meals = await activityDao.getMeals(bookingId, options);
    const enhancedMeals = activityService.enhanceActivities(meals);
    return enhancedMeals;
}

/**
 * @param {*} bookingId 
 * @param {*} mealId 
 * @returns all dishes for the given booking and meal, as key-value pairs, 
 * where the dish name is the key, and the dish ithe value
 */
export async function getMealItems(bookingId, mealId) {
    const mealItems = await activityDao.getMealItems(bookingId, mealId);
    const mealItemsByKey = mealItems.reduce((acc, item) => {
        acc[item.name] = item;
        return acc;
    }, {});
    return mealItemsByKey;
}

export async function deleteMealItem(bookingId, mealId, mealItemId) {
    return await activityDao.deleteMealItem(bookingId, mealId, mealItemId);
}

async function mapMealObject(mealData, isUpdate = false) {
    let meal = {};

    meal.category = utils.isString(mealData?.category) ? mealData.category : "meal";

    if(utils.isString(mealData?.subCategory)) meal.subCategory = mealData.subCategory;

    // The startingAt date might be entered later. It's usually how the guests want it
    if(utils.isDate(mealData?.startingAt)) {
        meal.startingAt = utils.toFireStoreTime(mealData.startingAt);
    }

    if(utils.isString(mealData?.status)) meal.status = mealData.status;

    if(utils.isString(mealData?.provider)) meal.provider = mealData.provider;

    if(utils.isString(mealData?.comments)) meal.comments = mealData.comments;

    if(!isUpdate) {
        meal.createdAt = new Date();
        meal.createdBy = await userService.getCurrentUserName();
    }

    return meal;
}

async function mapMealItemObject(data, isUpdate = false) {
    let object = {};

    if(utils.isString(data?.name))     object.name     = data.name;
    if(!utils.isEmpty(data?.quantity)) object.quantity = data.quantity;
    if(utils.isAmount(data?.price))    object.price    = data.price;
    if(utils.isString(data?.comments)) object.comments = data.comments;
    if(utils.isBoolean(data?.isFree))  object.isFree   = data.isFree;

    if(!isUpdate) {
        object.createdAt = new Date();
        object.createdBy = await userService.getCurrentUserName();
    }

    return object;
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
