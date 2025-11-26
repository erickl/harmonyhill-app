import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as activityService from "./activityService.js";
import * as inventoryService from "./inventoryService.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit} from "../daos/dao.js";

export async function getMealCategories() {
    return await activityDao.getTypes({"category" : "meal"});
}

// Group by e.g. mains, starters, drinks, etc...
export function groupByCourse(dishes) {
    // Group by e.g. mains, starters, drinks, etc...
    const groupedByCourse = Object.values(dishes).reduce((m, dish) => {
        const group = utils.isString(dish.course) && utils.isNumber(dish.priority) ? `${dish.priority},${dish.course}` : "9999,misc";
        if(!m[group]) m[group] = [];
        m[group].push(dish);
        return m;
    }, {});

    return groupedByCourse;
}

export async function addMeal(bookingId, mealData, onError, writes = []) {
    const commit = decideCommit(writes);

    const booking = await bookingDao.getOne(bookingId);
    if(!booking) {
        onError(`Booking ${bookingId} not found`)
        return false;
    }

    const meal = await mapMealObject(mealData);
    meal.house = booking.house;
    meal.name = booking.name
    meal.bookingId = bookingId;

    const dishes = Object.values(mealData.dishes);

    const mealId = makeMealId(meal.startingAt, booking.house, meal.subCategory);
    meal.id = mealId; //  needed by inventory sales
    meal.customerPrice = meal.isFree ? 0 : dishes.reduce((sum , dish) => sum + (dish.isFree ? 0 : dish.customerPrice), 0);
    const mealRecord = await activityDao.add(bookingId, mealId, meal, onError, writes);
    if(mealRecord === false) return false;

    let addedDishes = [];
    if(!utils.isEmpty(dishes)) {
        addedDishes = await addDishes(meal, mealId, dishes, onError, writes);
        if(addedDishes === false) return false;
        
        if(addedDishes.length !== Object.keys(mealData.dishes).length) {
            onError(`Unexpected error: Not all dishes were included`);
            return false;
        }
    }

    if(commit) {
        if(await commitTx(writes) === false) return false;
    }

    mealRecord.dishes = addedDishes;
    return mealRecord;
}

export async function removeMeal(meal, onError, writes = []) {
    const commit = decideCommit(writes);
    
    const dishes = await getMealDishes(meal.bookingId, meal.id);
    for(const dish of dishes) {
        const deleteDishResult = await deleteDish(meal, dish, onError, writes);
        if(deleteDishResult === false) return false;
    }

    const result = await activityService.remove(meal, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

async function deleteDish(meal, dish, onError, writes = []) {
    const commit = decideCommit(writes);

    const result1 = await activityDao.deleteDish(meal.bookingId, meal.id, dish.id, onError, writes);
    if(result1 === false) return false;

    const removeSaleResult = await inventoryService.removeSaleIfExists(dish.name, meal.id, onError, writes);
    if(removeSaleResult === false) return false;
    
    if(commit) return await commitTx(writes, onError);

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

async function addDishes(meal, mealId, dishesData, onError, writes) {
    // Add each meal item to DB
    let dishes = [];   
    for(const dishData of dishesData) {
        const addDishSuccess = await addDish(meal, mealId, dishData, onError, writes);
       
        if(addDishSuccess) {
            dishes.push(addDishSuccess);
        }
    }

    return dishes;
}

export async function update(bookingId, mealId, mealUpdateData, onError, writes = []) {
    const commit = decideCommit(writes);

    const existing = await getMeal(bookingId, mealId);
    if(!existing) {
        onError(`Cannot find meal ${bookingId}/${mealId}`);
        return false;
    } 

    // When changing assignee 
    if(utils.exists(mealUpdateData, "assignedTo") && utils.isString(mealUpdateData.assignedTo) && existing.assignedTo !== mealUpdateData.assignedTo) {
        mealUpdateData.assigneeAccept = false;
    }

    // Update meal data
    const mealUpdate = await mapMealObject(mealUpdateData);
    mealUpdate.customerPrice = mealUpdate.isFree ? 0 : mealUpdate.dishes.reduce((sum , dish) => sum + (dish.isFree ? 0 : dish.customerPrice), 0);
    const updateMealRecord = await activityDao.update(bookingId, mealId, mealUpdate, true, onError, writes);
    if(!updateMealRecord) {
        return false;
    }
    
    let updateDishesSuccess = false;

    // Update dishes data, if there are any updates to them
    if(!utils.isEmpty(mealUpdateData.dishes)) {
        const dishesData = Object.values(mealUpdateData.dishes);
        updateDishesSuccess = await updateDishes(existing, mealId, dishesData, onError, writes);
    }

    if(!updateDishesSuccess) {
        return false;
    }

    if(commit) {
        return await commitTx(writes, onError);
    }
    
    return updateMealRecord;
}

async function updateDishes(meal, mealId, dishesUpdateData, onError, writes) {
    let dishesUpdated = [];

    const existingDishes = await getMealDishes(meal.bookingId, mealId);

    // If any existingDishes are no longer part of the meal, delete dish
    for(const existingDish of Object.values(existingDishes)) {
        const dishUpdate = dishesUpdateData.find((dish) => dish.name === existingDish.name);
        if(!dishUpdate) {
            const deleteDishResult = await deleteDish(meal, existingDish, onError, writes);
            if(deleteDishResult === false) {
                return false;
            }
            dishesUpdated.push(`Deleted: ${existingDish.id}`);
        }
    }
    
    for(const dishUpdateData of dishesUpdateData) {
        if(utils.isEmpty(dishUpdateData.name)) continue;

        const existingDish = existingDishes.find((dish) => dish.name === dishUpdateData.name);
        
        if(!existingDish) {
            const addDishSuccess = await addDish(meal, mealId, dishUpdateData, onError, writes);
            if(addDishSuccess === false) return false;
            dishesUpdated.push(addDishSuccess);
        } else {
            const updateExistingDishResult = await updateDish(meal, existingDish, dishUpdateData, onError, writes);
            if(updateExistingDishResult === false) return false;
            dishesUpdated.push(updateExistingDishResult);
        }
    }

    return dishesUpdated;
}

async function updateDish(meal, existingDish, dishUpdateData, onError, writes) {
    const dishUpdate = await mapDishObject(dishUpdateData);
    const updateExistingDishResult = await activityDao.updateDish(meal.bookingId, meal.id, existingDish.id, dishUpdate, onError, writes);
    if(updateExistingDishResult === false) return false;

    // Check if inventory sale needs changing, only if dish quantity changed
    if(utils.exists(dishUpdate, "quantity") && dishUpdate.quantity !== existingDish.quantity) {
        const sale = await inventoryService.getSale(existingDish.name, meal.id, onError);
        if(sale) {
            const saleUpdate = await inventoryService.updateSale(meal, existingDish.name, dishUpdate.quantity, onError, writes);
            if(saleUpdate === false) return false;
        }   
    }

    return updateExistingDishResult;
}

async function addDish(meal, mealId, dishData, onError, writes) {
    const dish = await mapDishObject(dishData);
    const dishId = makeDishId(meal.startingAt, meal.house, meal.subCategory, dish.name);
            
    // Add meal item to the meal
    const addDishSuccess = await activityDao.addDish(meal.bookingId, mealId, dishId, dish, onError, writes);
    if(!addDishSuccess) {
        return false;
    }

    const inventoryItem = await inventoryService.getOne(dish.name, onError);
    if(inventoryItem) {
        const invItemSale = await inventoryService.addSale(meal, dish.name, dish.quantity, onError, writes);
        if(invItemSale === false) return false;
    }

    return addDishSuccess;
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
        const enhancedMeal = await activityService.enhanceActivities(meal);
        meals.push(enhancedMeal);
    }
    return meals;
}

export async function getMeal(bookingId, mealId, onError) {
    const meal = await activityDao.getOne(bookingId, mealId, onError);
    const enhancedMeal = await activityService.enhanceActivities(meal); 
    return enhancedMeal;
}

export async function getMealsByBooking(bookingId, options = {}) {
    const meals = await activityDao.getMeals(bookingId, options);
    const enhancedMeals = await activityService.enhanceActivities(meals);
    return enhancedMeals;
}

/**
 * @param {*} bookingId 
 * @param {*} mealId 
 * @returns all dishes for the given booking and meal, as key-value pairs, 
 * where the dish name is the key, and the dish is the value
 */
export async function getMealDishes(bookingId, mealId, filterOptions) {
    return await activityDao.getMealDishes(bookingId, mealId, filterOptions);
}

export async function getDishes(filterOptions, onError) {
    return await activityDao.getDishes(filterOptions, onError);
}

export function validate(customer, data, isUpdate, onError) {
    try {
        if(utils.isEmpty(data)) {
            onError("Fill in all required fields to submit");
            return false;
        }
        if(utils.isEmpty(data.startingAt)) {
            onError("Meal date required");
            return false;
        }

        if(utils.isDateTime(customer.checkInAt) && data.startingAt.startOf('day') < customer.checkInAt.startOf('day')) {
            onError(`Meal date too early. Must be within ${utils.to_ddMMM(customer.checkInAt)} - ${utils.to_ddMMM(customer.checkOutAt)}`);
            return false;
        }

        if(utils.isDateTime(customer.checkOutAt) && data.startingAt.startOf('day') > customer.checkOutAt.startOf('day')) {
            onError(`Meal date too late. Must be within ${utils.to_ddMMM(customer.checkInAt)} - ${utils.to_ddMMM(customer.checkOutAt)}`);
            return false;
        }

        // todo: get other lunches/dinners on this date. If this is not an update, we should decline?

        if(!utils.isEmpty(data.dishes)) {
            const dishes = Object.values(data.dishes);
            for(const dish of dishes) {
                if(dish.quantity === 0) {
                    onError(`All ordered dishes must have at least quantity of 1`);
                    return false;
                }
                if(utils.isEmpty(dish.name)) {
                    onError(`All dishes must be named`);
                    return false;
                }
            }
        }
    } catch(e) {
        onError(`Unexpected error in meal form: ${e.message}`);
        return true; // A bug shouldn't prevent you from submitting a meal?
    }

    return true;
}

async function mapMealObject(mealData) {
    let meal = {};

    meal.category = utils.isString(mealData?.category) ? mealData.category : "meal";

    if(utils.isString(mealData?.subCategory)) meal.subCategory = mealData.subCategory;

    if(utils.isString(mealData?.displayName)) meal.displayName = mealData.displayName;

    // The startingAt date might be entered later. It's usually how the guests want it
    if(utils.isDate(mealData?.startingAt)) {
        meal.startingAt = utils.toFireStoreTime(mealData.startingAt);
    }

    // Date is obligatory, but time might be set later, so might be null
    if(utils.exists(mealData, "startingTime")) {
        meal.startingTime = utils.isDate(mealData?.startingTime) ? utils.toFireStoreTime(mealData.startingTime) : null;
    }

    // Provider might not make sense here. I think we should use assignedTo instead, to assign to a staff member
    if(utils.isString(mealData?.provider)) meal.provider = mealData.provider;

    if(utils.isString(mealData?.assignedTo)) {
        meal.assignedTo = mealData.assignedTo;
    }

    if(utils.isBoolean(mealData?.assigneeAccept)) meal.assigneeAccept = mealData.assigneeAccept;

    if(utils.exists(mealData, "status")) {
        meal.status = utils.isString(mealData?.status) ? mealData.status : "pending guest confirmation";
    }

    if(utils.isString(mealData?.comments)) meal.comments = mealData.comments;

    if(utils.isBoolean(mealData?.isFree)) meal.isFree = mealData.isFree;
    
    if(utils.isAmount(mealData?.customerPrice)) meal.customerPrice = mealData.customerPrice;

    if(utils.exists(mealData, "changeDescription")) {
        meal.changeDescription = mealData.changeDescription;
    }

    return meal;
}

async function mapDishObject(data) {
    let object = {};

    if(utils.isString(data?.name))          object.name          = data.name;
    if(!utils.isEmpty(data?.quantity))      object.quantity      = data.quantity;
    if(utils.isAmount(data?.customerPrice)) object.customerPrice = data.customerPrice;
    if(utils.isString(data?.comments))      object.comments      = data.comments;
    if(utils.isBoolean(data?.isFree))       object.isFree        = data.isFree;
    if(utils.isBoolean(data?.custom))       object.custom        = data.custom;
    
    // Needed to sort the meals by course when displaying meal receipts
    if(utils.isNumber(data?.priority))      object.priority      = data.priority;
    if(utils.isString(data?.course))        object.course        = data.course;

    return object;
}

export async function toArrays(filters, onProgress, onError) {
    onProgress(0);

    filters.category = "meal";
    const meals = await activityService.getAll(filters, onError);
    onProgress(20);

    let rows = [["startingAt", "dish", "quantity", "course", "guestName", "house", "price", "mealFree", "dishFree", "assignedTo", "comments", "shouldBeFree"]];
    
    const mealCount = meals.length;
    const mealPercentagePoint = 0.8/mealCount;
    let progress = 0.2;
    
    for(let i = 0; i < mealCount; i++) {
        const meal = meals[i];
        const dishes = await getMealDishes(meal.bookingId, meal.id, filters);
        
        progress += mealPercentagePoint;
        onProgress(progress);
        
        for(const dish of dishes) {
            const x = meal.isFree && !dish.isFree ? "x" : "";
            //             startingAt, dish                                   guestName    house      price
            let row = [meal.startingAt, dish.name, dish.quantity, dish.course, meal.name, meal.house, dish.customerPrice, meal.isFree, dish.isFree, meal.assignedTo, dish.comments, x];
            row = row.map((col) => col === null || col === undefined ? "" : col);
            rows.push(row);
            //console.log(JSON.stringify(row));
        }
    }
    onProgress(100);

    return rows;
}

export function getNewCustomDish(id, name) {
    return {
        "id"            : `custom-dish-id-${id}`,
        "name"          : `${name}`,
        "custom"        : true,
        "isFree"        : false,
        "quantity"      : 0,
        "customerPrice" : 0,
        "course"        : "custom",
        "priority"      : 900
    };
}
