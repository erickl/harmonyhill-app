import * as activityDao from "../daos/activityDao.js";
import * as activityService from "./activityService.js";
import * as inventoryService from "./inventoryService.js";
import * as utils from "../utils.js";
import { commitTx, decideCommit } from "../daos/dao.js";

export async function getMealCategories() {
    return await activityDao.getTypes({ "category": "meal" });
}

// Group by e.g. mains, starters, drinks, etc...
export function groupByCourse(dishes) {
    // Group by e.g. mains, starters, drinks, etc...
    const groupedByCourse = Object.values(dishes).reduce((m, dish) => {
        const group = utils.isString(dish.course) && utils.isNumber(dish.priority) ? `${dish.priority},${dish.course}` : "9999,misc";
        if (!m[group]) m[group] = [];
        m[group].push(dish);
        return m;
    }, {});

    return groupedByCourse;
}

export async function addMeal(booking, mealData, onError, writes = []) {
    const commit = decideCommit(writes);

    const meal = mapMealObject(mealData);
    meal.house = booking.house;
    meal.name = booking.name
    meal.bookingId = booking.id;

    const dishes = Object.values(mealData.dishes);

    const mealId = makeMealId(meal.startingAt, booking.house, meal.subCategory);
    meal.id = mealId; //  needed by inventory sales
    const mealRecord = await activityDao.add(booking.id, mealId, meal, onError, writes);
    if (mealRecord === false) return false;

    let addedDishes = [];
    if (!utils.isEmpty(dishes)) {
        addedDishes = await addDishes(meal, mealId, dishes, onError, writes);
        if (addedDishes === false) return false;

        if (addedDishes.length !== Object.keys(mealData.dishes).length) {
            return onError(`Unexpected error: Not all dishes were included`);
        }
    }

    if (commit) {
        if (await commitTx(writes) === false) return false;
    }

    mealRecord.dishes = addedDishes;
    const enhancedMealRecord = await activityService.enhanceActivities(mealRecord, booking);
    return enhancedMealRecord;
}

export async function removeMeal(meal, onError, writes = []) {
    const commit = decideCommit(writes);

    const dishes = await getMealDishes(meal.bookingId, meal.id);
    const deleteResults = await Promise.all(
        dishes.map(dish => deleteDish(meal, dish, onError, writes))
    );
    
    const anyFailed = deleteResults.includes(false);
    if(anyFailed) return false;

    const result = await activityService.remove(meal, onError, writes);
    if (result === false) return false;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

async function deleteDish(meal, dish, onError, writes = []) {
    const commit = decideCommit(writes);

    const [removeDishResult, removeSaleResult] = await Promise.all([
        activityDao.deleteDish(meal.bookingId, meal.id, dish.id, onError, writes),
        inventoryService.removeSaleIfExists(dish.name, meal.id, onError, writes)
    ]);

    if (removeDishResult === false) return false;
    if (removeSaleResult === false) return false;

    if (commit) return await commitTx(writes, onError);

    return true;
}

// Example result: 250530-hh-breakfast-178492929
export function makeMealId(startingAt, house, meal) {
    const houseShort = house.toLowerCase().trim() === "harmony hill" ? "hh" : "jn";
    startingAt = utils.to_YYMMdd(startingAt);
    return `${startingAt}-${houseShort}-${meal.replace(/ /g, "-")}-${Date.now()}`;
}

// Example result: 250530-hh-breakfast-lentil-bolognese-178492929
export function makeDishId(startingAt, house, meal, dishName) {
    const houseShort = house.toLowerCase().trim() === "harmony hill" ? "hh" : "jn";
    startingAt = utils.to_YYMMdd(startingAt);
    dishName = dishName.trim().toLowerCase().replace(/ /g, "-");
    meal = meal.replace(/ /g, "-");
    return `${startingAt}-${houseShort}-${meal}-${dishName}-${Date.now()}`;
}

/**
 * Add each meal item (dish) to the database
 * @param {*} meal 
 * @param {*} mealId 
 * @param {*} dishesData 
 * @param {*} onError 
 * @param {*} writes 
 * @returns all dishes which successfully was added to the database
 */
async function addDishes(meal, mealId, dishesData, onError, writes) {
    const dishes = await Promise.all(
        dishesData.map(dishData => addDish(meal, mealId, dishData, onError, writes))
    );

    if(dishes.includes(false)) return false;

    return dishes;
}

export async function update(booking, meal, mealUpdateData, onError, writes = []) {
    const commit = decideCommit(writes);

    // When changing assignee 
    if (utils.exists(mealUpdateData, "assignedTo") && utils.isString(mealUpdateData.assignedTo) && meal.assignedTo !== mealUpdateData.assignedTo) {
        mealUpdateData.assigneeAccept = false;
        mealUpdateData.changeDescription = null;
    }       

    // Update meal data
    const mealUpdate = mapMealObject(mealUpdateData);
    const updateMealRecord = await activityDao.update(booking.id, meal.id, mealUpdate, true, onError, writes);
    if (updateMealRecord === false) return false;

    // Update dishes data
    const dishesData = Object.values(mealUpdateData.dishes);
    const updateDishesSuccess = await updateDishes(updateMealRecord, meal.id, dishesData, onError, writes);
    if (updateDishesSuccess === false) return false;
    updateMealRecord.dishes = updateDishesSuccess;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    const enhancedMealRecord = await activityService.enhanceActivities(updateMealRecord, booking);
    return enhancedMealRecord;
}

async function updateDishes(updatedMeal, mealId, dishesUpdateData, onError, writes) {
    const promises = [];

    const existingDishes = await getMealDishes(updatedMeal.bookingId, mealId);

    // If any existingDishes are no longer part of the meal, delete dish
    for (const existingDish of Object.values(existingDishes)) {
        const dishUpdate = dishesUpdateData.find((dish) => dish.name === existingDish.name);
        if (!dishUpdate) {
            promises.push(deleteDish(updatedMeal, existingDish, onError, writes));
        }
    }

    for (const dishUpdateData of dishesUpdateData) {
        if (utils.isEmpty(dishUpdateData.name)) continue;

        const existingDish = existingDishes.find((dish) => dish.name === dishUpdateData.name);

        if (!existingDish) {
            promises.push(addDish(updatedMeal, mealId, dishUpdateData, onError, writes));
        } else {
            promises.push(updateDish(updatedMeal, existingDish, dishUpdateData, onError, writes));
        }
    }

    const results = await Promise.all(promises);
    
    const anyFailedResult = results.includes(false);
    if(anyFailedResult) return false;

    return results;
}

async function updateDish(updatedMeal, existingDish, dishUpdateData, onError, writes) {
    const dishUpdate = mapDishObject(dishUpdateData);

    const updateDishPromise = activityDao.updateDish(updatedMeal.bookingId, updatedMeal.id, existingDish.id, dishUpdate, onError, writes);

    // Check if inventory sale needs changing, if dish is changed
    const checkInventorySale = async() => {
        const sale = await inventoryService.getSale(existingDish.name, updatedMeal.id, onError);
        if (sale) {
            return await inventoryService.updateSale(updatedMeal, dishUpdate, onError, writes);
        }
        return true;
    };

    const results = await Promise.all([updateDishPromise, checkInventorySale()]);
    if(results.includes(false)) return false;

    return results[0]; // resolved update-dish promise
}

async function addDish(meal, mealId, dishData, onError, writes) {
    const dish = mapDishObject(dishData);
    const dishId = makeDishId(meal.startingAt, meal.house, meal.subCategory, dish.name);

    // Add meal item to the meal
    const addDishPromise = activityDao.addDish(meal.bookingId, mealId, dishId, dish, onError, writes);
    
    // Check if the dish is part of our countable inventory (e.g a cookie)
    const checkInventorySale = async() => {
        const inventoryItem = await inventoryService.getOne(dish.name, onError);
        if (inventoryItem) {
            return await inventoryService.addSale(meal, dish.name, dish.quantity, onError, writes);
        }
        return true;
    }
    
    const results = await Promise.all([addDishPromise, checkInventorySale()]);
    if(results.includes(false)) return false;

    return results[0]; // resolved add-dish promise
}

export async function getMealsByBooking(booking, options = {}) {
    const meals = await activityDao.getMeals(booking.id, options);
    const enhancedMeals = await activityService.enhanceActivities(meals, booking);
    return enhancedMeals;
}

/**
 * @param {*} bookingId 
 * @param {*} mealId 
 * @returns all dishes for the given booking and meal, as key-value pairs, 
 * where the dish name is the key, and the dish is the value
 */
export async function getMealDishes(bookingId, mealId, filterOptions, onError) {
    return await activityDao.getMealDishes(bookingId, mealId, filterOptions, onError);
}

export async function getDishes(filterOptions, onError) {
    return await activityDao.getDishes(filterOptions, onError);
}

export function validate(customer, data, isUpdate, onError, onWarning) {
    let warning = false;

    try {
        if (utils.isEmpty(data)) {
            onError("Fill in all required fields to submit");
            return false;
        }
        if (utils.isEmpty(data.startingAt)) {
            onError("Meal date required");
            return false;
        }

        if (utils.isDateTime(customer.checkInAt) && data.startingAt.startOf('day') < customer.checkInAt.startOf('day')) {
            warning = true;
            onWarning(`Beware! Activity date is before checkin date ${utils.to_ddMMM(customer.checkInAt)}`);
            //return false; // We will allow this as there are exceptions, but display a warning
        }

        if (utils.isDateTime(customer.checkOutAt) && data.startingAt.startOf('day') > customer.checkOutAt.startOf('day')) {
            warning = true;
            onWarning(`Beware! Activity date is after checkout date ${utils.to_ddMMM(customer.checkOutAt)}`);
            //return false; // We will allow this as there are exceptions, but display a warning
        }

        if (!warning) {
            onWarning(null);
        }

        // todo: get other lunches/dinners on this date. If this is not an update, we should decline?

        if (!utils.isEmpty(data.dishes)) {
            const dishes = Object.values(data.dishes);
            for (const dish of dishes) {
                if (dish.quantity === 0) {
                    onError(`All ordered dishes must have at least quantity of 1`);
                    return false;
                }
                if (utils.isEmpty(dish.name)) {
                    onError(`All dishes must be named`);
                    return false;
                }
            }
        }
    } catch (e) {
        onError(`Unexpected error in meal form: ${e.message}`);
        return true; // A bug shouldn't prevent you from submitting a meal?
    }

    onError(null);

    return true;
}

function mapMealObject(mealData) {
    let meal = {};

    meal.category = utils.isString(mealData?.category) ? mealData.category : "meal";

    if (utils.isString(mealData?.subCategory)) meal.subCategory = mealData.subCategory;

    if (utils.isString(mealData?.displayName)) meal.displayName = mealData.displayName;

    // The startingAt date might be entered later. It's usually how the guests want it
    if (utils.isDate(mealData?.startingAt)) {
        meal.startingAt = utils.toFireStoreTime(mealData.startingAt);
    }

    // Date is obligatory, but time might be set later, so might be null
    if (utils.exists(mealData, "startingTime")) {
        meal.startingTime = utils.isDate(mealData?.startingTime) ? utils.toFireStoreTime(mealData.startingTime) : null;
    }

    // Provider might not make sense here. I think we should use assignedTo instead, to assign to a staff member
    if (utils.isString(mealData?.provider)) meal.provider = mealData.provider;

    if (utils.isString(mealData?.assignedTo)) {
        meal.assignedTo = mealData.assignedTo;
    }

    if (utils.isBoolean(mealData?.assigneeAccept)) meal.assigneeAccept = mealData.assigneeAccept;

    if (utils.exists(mealData, "status")) {
        meal.status = utils.isString(mealData?.status) ? mealData.status : "pending guest confirmation";
    }

    if (utils.isString(mealData?.comments)) meal.comments = mealData.comments;

    if (utils.isBoolean(mealData?.isFree)) {
        meal.isFree = mealData.isFree;
    } else {
        meal.isFree = false;
    }

    if (mealData.isFree) {
        meal.customerPrice = 0;
    } else {
        // Note: The floating breakfast might cost something in itself, even without the dishes
        meal.customerPrice = mealData.customerPrice
    }

    if (utils.exists(mealData, "changeDescription")) {
        meal.changeDescription = mealData.changeDescription;
    }

    return meal;
}

function mapDishObject(data) {
    let object = {};

    if (utils.isString(data?.name)) object.name = data.name;
    if (!utils.isEmpty(data?.quantity)) object.quantity = data.quantity;
    if (utils.isAmount(data?.customerPrice)) object.customerPrice = data.customerPrice;
    if (utils.isString(data?.comments)) object.comments = data.comments;
    if (utils.isBoolean(data?.isFree)) object.isFree = data.isFree;
    if (utils.isBoolean(data?.custom)) object.custom = data.custom;

    // Needed to sort the meals by course when displaying meal receipts
    if (utils.isNumber(data?.priority)) object.priority = data.priority;
    if (utils.isString(data?.course)) object.course = data.course;

    return object;
}

export async function toArrays(filters, onProgress, onError) {
    onProgress(0);

    filters.category = "meal";
    const meals = await activityService.getAll(filters, onError);
    onProgress(20);

    let rows = [["startingAt", "dish", "quantity", "course", "guestName", "house", "price", "dishFree", "assignedTo", "comments"]];

    const mealCount = meals.length;
    const mealPercentagePoint = 0.8 / mealCount;
    let progress = 0.2;

    for (let i = 0; i < mealCount; i++) {
        const meal = meals[i];
        const dishes = await getMealDishes(meal.bookingId, meal.id, filters);

        progress += mealPercentagePoint;
        onProgress(progress);

        for (const dish of dishes) {
            //             startingAt,   dish                                  guestName    house      price
            let row = [meal.startingAt, dish.name, dish.quantity, dish.course, meal.name, meal.house, dish.customerPrice, dish.isFree, meal.assignedTo, dish.comments];
            row = row.map((col) => col === null || col === undefined ? "" : col);
            rows.push(row);
        }
    }
    onProgress(100);

    return rows;
}

export function getNewCustomDish(id, name) {
    return {
        "id": `custom-dish-id-${id}`,
        "name": `${name}`,
        "custom": true,
        "isFree": false,
        "quantity": 0,
        "customerPrice": 0,
        "course": "custom",
        "priority": 900
    };
}
