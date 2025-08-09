import * as activityDao from "../daos/activityDao.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as activityService from "./activityService.js";
import * as utils from "../utils.js";

export async function getMealCategories() {
    return await activityDao.getTypes({"category" : "meal"});
}

export async function addMeal(bookingId, mealData, onError) {
    let mealId = false;

    // Atomic transaction: either all DB adds/updates happen, or none does
    const addMealSuccess = await activityDao.transaction(async () => {
        const booking = await bookingDao.getOne(bookingId);
        if(!booking) {
            console.error(`Booking ${bookingId} not found`);
            return false;
        }

        const meal = await mapMealObject(mealData);
        meal.house = booking.house;
        meal.name = booking.name
        meal.bookingId = bookingId;

        mealId = makeMealId(meal.startingAt, booking.house, meal.subCategory);
        const success = await activityDao.add(bookingId, mealId, meal, onError);
        if(!success) {
            // todo: pass onError to the add function
            return false; 
        }

        if(!utils.isEmpty(mealData.dishes)) {
            const returnedDishIds = await addDishes(bookingId, mealId, Object.values(mealData.dishes), onError);
            if(returnedDishIds.length !== Object.keys(mealData.dishes).length) {
                //onError("Not all dishes were successfully uploaded");
                // todo: pass onError to the add function: not all dishes were successfully uploaded
                return false;
            }
        }
    });

    return addMealSuccess ? mealId : false;
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
        if(!meal.isFree) {
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

        // Update meal data
        const mealUpdate = await mapMealObject(mealUpdateData);
        const updateMealSuccess = await activityDao.update(bookingId, mealId, mealUpdate, true, onError);
        if(!updateMealSuccess) {
            return false;
        }
        
        let updateDishesSuccess = false;

        // Update dishes data, if there are any updates to them
        if(!utils.isEmpty(mealUpdateData.dishes)) {
            const dishesData = Object.values(mealUpdateData.dishes);
            updateDishesSuccess = await updateDishes(bookingId, mealId, dishesData, onError);
        }

        if(!updateDishesSuccess) {
            return false;
        }

        // Update total meal price
        if(updateDishesSuccess !== false) {
            const updatedDishes = await getDishes(bookingId, mealId);

            const customerMealTotalPrice = mealUpdateData["isFree"] ? 0 : Object.values(updatedDishes).reduce((sum, dish) => {
                return sum + (dish.isFree ? 0 : dish.quantity * parseInt(dish.customerPrice));
            }, 0);
            
            const updateMealPriceSuccess = await activityDao.update(bookingId, mealId, { customerPrice: customerMealTotalPrice }, true, onError);
            
            if(!updateMealPriceSuccess) {
                onError(`Cannot update total meal price for meal with dish ${mealId}`);
                return false;
            }
        }
    });

    return updateMealSuccess;
}

async function updateDishes(bookingId, mealId, dishesUpdateData, onError) {
    const meal = await getMeal(bookingId, mealId);
    if(!meal) {
        onError(`Cannot find meal ${bookingId}/${mealId} in database`);
        return false;
    }

    const existingDishes = await getDishes(bookingId, mealId);

    let dishesUpdated = [];
    
    for(const dishUpdateData of dishesUpdateData) {
        if(utils.isEmpty(dishUpdateData.name)) {// || dishUpdateData.quantity === 0) {
            continue;
        }
        const dishUpdate = await mapDishObject(dishUpdateData);
        const existingDish = existingDishes[dishUpdate.name];
        
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
export async function getDishes(bookingId, mealId) {
    const dishes = await activityDao.getDishes(bookingId, mealId);
    const dishesByKey = dishes.reduce((res, dish) => {
        res[dish.name] = dish;
        return res;
    }, {});
    return dishesByKey;
}

export async function deleteDish(bookingId, mealId, dishId) {
    return await activityDao.deleteDish(bookingId, mealId, dishId);
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

        // If dateTime decided and staff assigned, then it counts as confirmed
        if(data.status === "confirmed") {
            if(utils.isEmpty(data.assignedTo)) {
                onError(`Status can only be "confirmed" if it's assigned to a staff member`);
                return false;
            } 
            if(!utils.isDate(data.startingAt)) {
                onError(`Status can only be "confirmed" if a date is set`);
                return false;
            }
            if(!utils.isDate(data.startingTime)) {
                onError(`Status can only be "confirmed" if a time is set`);
                return false;
            }

            // All meals are internal activities
            //if(data.internal !== true && utils.isEmpty(data.provider)) {}
        }

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
    meal.startingTime = utils.isDate(mealData?.startingTime) ? utils.toFireStoreTime(mealData.startingTime) : null;

    // Provider might not make sense here. I think we should use assignedTo instead, to assign to a staff member
    if(utils.isString(mealData?.provider)) meal.provider = mealData.provider;

    if(utils.isString(mealData?.assignedTo)) {
        meal.assignedTo = mealData.assignedTo;
    }

    meal.status = utils.isString(mealData?.status) ? mealData.status : "requested";

    if(utils.isString(mealData?.comments)) meal.comments = mealData.comments;

    if(utils.isBoolean(mealData?.isFree)) meal.isFree = mealData.isFree;
    
    if(utils.isBoolean(mealData?.customerPrice)) meal.customerPrice = mealData.customerPrice;

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

    const dishIds = await addDishes(bookingId, mealId, [{
        name: "Wingko Waffle",
        customerPrice: 100,
        quantity: 2,
    },{
        name: "Fruit Salad",
        customerPrice: 50,
        quantity: 1,
    }]);

    const meal = await getMeal(bookingId, mealId);
    if(!meal) {
        return false;
    }
    if(meal.customerPrice !== 150) {
        return false;
    }

    const returnedMealItems = await getDishes(bookingId, mealId);
    const wingkoMealItem = returnedMealItems.find(mealItem => mealItem.name === "Wingko Waffle");

    let x = 1;
}

export function getNewCustomDish(id, name) {
    return {
        "id"            : `custom-dish-id-${id}`,
        "name"          : `${name}`,
        "custom"        : true,
        "quantity"      : 0,
        "customerPrice" : 0,
    };
}
