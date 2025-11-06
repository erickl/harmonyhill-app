import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as activityService from "./activityService.js";
import * as utils from "../utils.js";

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

export async function addMeal(bookingId, mealData, onError) {
    let mealId = false;

    // Atomic transaction: either all DB adds/updates happen, or none does
    const addMealSuccess = await activityDao.transaction(async () => {
        const booking = await bookingDao.getOne(bookingId);
        if(!booking) {
            throw new Error(`Booking ${bookingId} not found`)
        }

        const meal = await mapMealObject(mealData);
        meal.house = booking.house;
        meal.name = booking.name
        meal.bookingId = bookingId;

        mealId = makeMealId(meal.startingAt, booking.house, meal.subCategory);
        const mealRecord = await activityDao.add(bookingId, mealId, meal, onError);
        if(mealRecord === false) {
            throw new Error(`Could not add meal ${mealId}`)
        }

        if(!utils.isEmpty(mealData.dishes)) {
            const returnedDishIds = await addDishes(bookingId, mealId, Object.values(mealData.dishes), onError);
            if(returnedDishIds.length !== Object.keys(mealData.dishes).length) {
                throw new Error(`Not all dishes were successfully uploaded for meal ${mealId}`)
            }
        }

        return mealRecord;
    });

    return addMealSuccess ? mealId : false;
}

export async function removeMeal(meal, onError) {
    const success = await activityDao.transaction(async () => {
        const dishes = await getMealDishes(meal.bookingId, meal.id);
        for(const dish of dishes) {
            const deleteDishResult = await deleteDish(meal.bookingId, meal.id, dish.id, onError);
            if(deleteDishResult === false) {
                throw new Error(`Unexpected error when deleting dish ${dish.id}`);
            }
        }

        const success = await activityService.remove(meal, onError);
        if(success === false) {
            throw new Error(`Unexpected error when deleting meal ${meal.id}`);
        }

        return true;
    });

    return success;
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

async function addDishes(bookingId, mealId, dishesData, onError) {
    const meal = await activityDao.getOne(bookingId, mealId);
    if(!meal) {
        onError(`Meal ${bookingId}/${mealId} not found`);
        return false;
    }
    let runningTotalMealPrice = meal.customerPrice ? meal.customerPrice : 0;

    // Add each meal item to DB
    let dishes = [];   
    for(const dishData of dishesData) {
        const dish = await mapDishObject(dishData);
        const dishId = makeDishId(meal.startingAt, meal.house, meal.subCategory, dish.name);
             
        // Add meal item to the meal
        const addDishSuccess = await activityDao.addDish(bookingId, mealId, dishId, dish, onError);
        if(!addDishSuccess) {
            throw new Error(`Cannot add dish ${dishId}`);
        }

        // Update the total meal customerPrice
        if(!meal.isFree && !dish.isFree) {
            runningTotalMealPrice += dish.isFree ? 0 : dish.customerPrice * dish.quantity;
            const updateMealPriceSuccess = await activityDao.update(bookingId, mealId, { customerPrice: runningTotalMealPrice }, false, onError);
            if(!updateMealPriceSuccess) {
                throw new Error(`Cannot update total meal price for meal with dish ${dishId}`);
            }
        }
       
        if(addDishSuccess) {
            dishes.push(dishId);
        }
    }
    return dishes;
}

export async function update(bookingId, mealId, mealUpdateData, onError) {
    const updateMealSuccess = await activityDao.transaction(async () => {
        const existing = await getMeal(bookingId, mealId);
        if(!existing) {
            throw new Error(`Cannot find meal ${bookingId}/${mealId}`);
        } 

        // When changing assignee 
        if(utils.exists(mealUpdateData, "assignedTo") && utils.isString(mealUpdateData.assignedTo) && existing.assignedTo !== mealUpdateData.assignedTo) {
            mealUpdateData.assigneeAccept = false;
        }

        // Update meal data
        const mealUpdate = await mapMealObject(mealUpdateData);
        const updateMealRecord = await activityDao.update(bookingId, mealId, mealUpdate, true, onError);
        if(!updateMealRecord) {
            throw new Error(`Cannot update meal ${bookingId}/${mealId}`);
        }
        
        let updateDishesSuccess = false;

        // Update dishes data, if there are any updates to them
        if(!utils.isEmpty(mealUpdateData.dishes)) {
            const dishesData = Object.values(mealUpdateData.dishes);
            updateDishesSuccess = await updateDishes(bookingId, mealId, dishesData, onError);
        }

        if(!updateDishesSuccess) {
            throw new Error(`Cannot update dishes for ${bookingId}/${mealId}`);
        }

        // Update total meal price
        if(updateDishesSuccess !== false) {
            const updatedDishes = await getMealDishes(bookingId, mealId);

            const customerMealTotalPrice = mealUpdateData["isFree"] ? 0 : Object.values(updatedDishes).reduce((sum, dish) => {
                return sum + (dish.isFree ? 0 : dish.quantity * parseInt(dish.customerPrice));
            }, 0);
            
            const updateMealPriceSuccess = await activityDao.update(bookingId, mealId, { customerPrice: customerMealTotalPrice }, true, onError);
            
            if(!updateMealPriceSuccess) {
                throw new Error(`Cannot update total meal price for meal with dish ${mealId}`);
            }
        }
        
        return updateMealRecord;
    });

    return updateMealSuccess;
}

async function updateDishes(bookingId, mealId, dishesUpdateData, onError) {
    let dishesUpdated = [];

    const meal = await getMeal(bookingId, mealId);
    if(!meal) {
        onError(`Cannot find meal ${bookingId}/${mealId} in database`);
        return false;
    }

    const existingDishes = await getMealDishes(bookingId, mealId);

    // If any existingDishes are no longer part of the meal, delete dish
    for(const existingDish of Object.values(existingDishes)) {
        const dishUpdate = dishesUpdateData.find((dish) => dish.name === existingDish.name);
        if(!dishUpdate) {
            const deleteDishResult = await deleteDish(bookingId, mealId, existingDish.id);
            if(deleteDishResult === false) {
                onError(`Unexpected error when deleting dish ${existingDish.id}. Contact admin, please`);
                return false;
            }
            dishesUpdated.push(`Deleted: ${existingDish.id}`);
        }
    }
    
    for(const dishUpdateData of dishesUpdateData) {
        if(utils.isEmpty(dishUpdateData.name)) {// || dishUpdateData.quantity === 0) {
            continue;
        }

        const dishUpdate = await mapDishObject(dishUpdateData);
        const existingDish = existingDishes.find((dish) => dish.name === dishUpdate.name);
        
        if(!existingDish) {
            const newDishId = makeDishId(meal.startingAt, meal.house, meal.subCategory, dishUpdate.name);
            const addNewDishResult = await activityDao.addDish(bookingId, mealId, newDishId, dishUpdate, onError);
            if(addNewDishResult !== false) {
                dishesUpdated.push(newDishId);
            } else {
                throw new Error(`Cannot add new dish ${newDishId} to meal ${bookingId}/${mealId}`);
            }
        } else {
            const updateExistingDishResult = await activityDao.updateDish(bookingId, mealId, existingDish.id, dishUpdate, onError);
            if(updateExistingDishResult !== false) {
                dishesUpdated.push(existingDish.id);
            } else {
                throw new Error(`Cannot update existing dish ${existingDish.id} to meal ${bookingId}/${mealId}`);
            }
        }
    }
    
    return dishesUpdated;
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

export async function getMeal(bookingId, mealId) {
    const meal = await activityDao.getOne(bookingId, mealId);
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

export async function deleteDish(bookingId, mealId, dishId, onError) {
    return await activityDao.deleteDish(bookingId, mealId, dishId, onError);
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
    
    if(utils.isBoolean(mealData?.customerPrice)) meal.customerPrice = mealData.customerPrice;

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

export async function toArrays(filters, onError) {
    filters.category = "meal";
    const meals = await activityService.getAll(filters, onError);

    let rows = [["startingAt", "dish", "quantity", "course", "guestName", "house", "price", "mealFree", "dishFree", "assignedTo", "comments", "shouldBeFree"]];

    for(const meal of meals) {
        const dishes = await getMealDishes(meal.bookingId, meal.id, filters);
        for(const dish of dishes) {
            const x = meal.isFree && !dish.isFree ? "x" : "";
            //             startingAt, dish                                   guestName    house      price
            let row = [meal.startingAt, dish.name, dish.quantity, dish.course, meal.name, meal.house, dish.customerPrice, meal.isFree, dish.isFree, meal.assignedTo, dish.comments, x];
            row = row.map((col) => col === null || col === undefined ? "" : col);
            rows.push(row);
            //console.log(JSON.stringify(row));
        }
    }

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
