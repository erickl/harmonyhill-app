import * as menuDao from '../daos/menuDao.js';
import * as bookingService from './bookingService.js';
import * as utils from "../utils.js";

/**
 * filters = {
 *      meal:         "breakfast"|"lunch"|"dinner"
 *      allergens:    ["gluten", "soy", "nuts", ...]
 *      house:        "harmony hill"|"jungle nook"
 *      isFavorite:    true|false
 *      isAvailable:   Will be true and cannot be be changed
 * }
 * groupByCourse: if true, group meals by course (e.g. lunch meals), e.g. mains, starters, desserts, etc...
 */
export async function get(options = {}) {
    const menu = await menuDao.get(options);
    return menu;
}

export async function groupByCourse(options = {}) {
    const menu = await menuDao.get(options);
    
    // Group by e.g. mains, starters, drinks, etc...
    const groupedMenu = menu.reduce((m, dish) => {
        const group = utils.isString(dish.course) ? `${dish.priority},${dish.course}` : "9999,misc";
        if(!m[group]) m[group] = [];
        m[group].push(dish);
        return m;
    }, {});

    return groupedMenu;
}

/**
 * 
 * @param {*} bookingId ID from the booking collection (from which this function will derive the house)
 * @param {*} options same as in get() above
 * @returns array of food menu options. Menu availability might differ depending on house and meal category (lunch, breakfast, etc.)
 */
export async function getByBookingId(bookingId, options = {}) {
    const house = await bookingService.getHouse(bookingId);
    if(!house) {
        console.log("Booking not found or house not specified");
        return false;
    }
    
    options.house = house.toLowerCase();
    const menuItems = await get(bookingId, options);
    return menuItems;
}

export async function testGetMenuItems() {
    let options1 = {mealCategory: "lunch", house: "harmony hill", allergens: ["nuts"]};
    const lunchMenuItemsWithoutNuts = await get(options1);
    console.log(JSON.stringify(lunchMenuItemsWithoutNuts, null, 2));
    let options2 = {mealCategory: "lunch", house: "jungle nook", allergens: []};
    const lunchMenuItems = await get(options2);

    const bookingId = "Eric-Klaesson-hh-251110";
    const menuItemsAvailableByBooking = await getByBookingId(bookingId, {mealCategory: "lunch"});

    let x = 1;
}
