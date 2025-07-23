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
    meal.house = booking.house;

    const mealId = makeMealId(meal.startingAt, booking.house, meal.subCategory);
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

    return success ? mealId : false;
}

// Example result: 250530-hh-breakfast
export function makeMealId(startingAt, house, meal) {
    const houseShort = house.toLowerCase().trim() === "harmony hill" ? "hh" : "jn";
    startingAt = utils.to_YYMMdd(startingAt);
    return `${startingAt}-${houseShort}-${meal.replace(/ /g, "-")}`;
}

// Example result: 250530-hh-breakfast-lentil-bolognese
export function makeDishId(startingAt, house, meal, dishName) {
    dishName = dishName.trim().toLowerCase().replace(/ /g, "-");
    const mealId = makeMealId(startingAt, house, meal);
    return `${mealId}-${dishName}`;
}

async function updateDishes(bookingId, mealId, newDishesData, onError) {
    const meal = await getMeal(bookingId, mealId);
    if(!meal) {
        onError(`Cannot find meal ${bookingId}/${mealId} in database`);
        return false;
    }

    let dishesUpdates = [];
    
    for(const newDishData of newDishesData) {
        if(utils.isEmpty(newDishData.name) || newDishData.quantity === 0) {
            continue;
        }
        const newDish = await mapDishObject(newDishData);
        const newDishId = makeDishId(newDish.startingAt, meal.house, meal.subCategory, newDish.name);
        
        const updateDishSuccess = await activityDao.updateDish(bookingId, mealId, newDishId, newDish, onError);
        if(!updateDishSuccess) {
            throw new Error(`Cannot update dish ${newDishId}`);
        } else {
            dishesUpdates.push(newDishId);
        }
    }
    
    return dishesUpdates;
}

async function addDishes(bookingId, mealId, dishesData, onError) {
    const meal = await activityDao.getOne(bookingId, mealId);
    if(!meal) {
        onError(`Meal ${bookingId}/${mealId} not found`);
        return false;
    }
    let runningTotalMealPrice = meal.customerPrice ? meal.customerPrice : 0;

    // todo: should adding all dishes be in one single DB transaction?
    // Add each meal item
    let dishes = [];   
    for(const dishData of dishesData) {
        const dish = await mapDishObject(dishData);
        const dishId = makeDishId(meal.startingAt, meal.house, meal.subCategory, dish.name);
        
        // Atomic transaction: either both DB updates happen, or none does
        const addDishesSuccess = await activityDao.transaction(async () => {
            // Add meal item to the meal
            const addDishSuccess = await activityDao.addDish(bookingId, mealId, dishId, dish, onError);
            if(!addDishSuccess) {
                throw new Error(`Cannot add dish ${dishId}`);
            }

            // Update the total meal customerPrice
            runningTotalMealPrice += dish.isFree ? 0 : dish.customerPrice * dish.quantity;
            const updateMealPriceSuccess = await activityDao.update(bookingId, mealId, { customerPrice: runningTotalMealPrice }, false, onError);
            if(!updateMealPriceSuccess) {
                throw new Error(`Cannot update total meal price for meal with dish ${dishId}`);
            }
        });

        if(addDishesSuccess) {
            dishes.push(dishId);
        }
    }
    return dishes;
}

export async function update(bookingId, mealId, mealUpdateData, onError) {
    const updateMealSuccess = await activityDao.transaction(async () => {

        // Update meal data
        const mealUpdate = await mapMealObject(mealUpdateData, true);
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
        if(updateDishesSuccess !== false && !utils.isEmpty(updateDishesSuccess)) {
            const updatedDishes = await getDishes(bookingId, mealId);
            
            const customerMealTotalPrice = Object.values(updatedDishes).reduce((sum, dish) => {
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

export function validate(data) {
    if(utils.isEmpty(data)) {
        return false;
    }
    if(utils.isEmpty(data.startingAt)) {
        return false;
    }
    if(!utils.isEmpty(data.dishes)) {
        const dishes = Object.values(data.dishes);
        for(const dish of dishes) {
            if(dish.quantity === 0) {
                return false;
            }
            if(utils.isEmpty(dish.name)) {
                return false;
            }
        }
    }

    return true;
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

async function mapDishObject(data, isUpdate = false) {
    let object = {};

    if(utils.isString(data?.name))          object.name          = data.name;
    if(!utils.isEmpty(data?.quantity))      object.quantity      = data.quantity;
    if(utils.isAmount(data?.customerPrice)) object.customerPrice = data.customerPrice;
    if(utils.isString(data?.comments))      object.comments      = data.comments;
    if(utils.isBoolean(data?.isFree))       object.isFree        = data.isFree;
    if(utils.isBoolean(data?.custom))       object.custom        = data.custom;

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
        "customerPrice" : 100000,
    };
}
