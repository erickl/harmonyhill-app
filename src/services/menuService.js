import * as menuDao from '../daos/menuDao.js';

/**
 * filters = {
 *      mealCategory: "breakfast"|"lunch"|"dinner"
 *      allergens:    ["gluten", "soy", "nuts", ...]
 *      house:        "harmony hill"|"jungle nook"
 *      isFavorite:    true|false
 *      isAvailable:   Will be true and cannot be be changed
 * }
 */
export async function get(options = {}) {
    const menu = await menuDao.get(options);
    return menu;
}

export async function testGetMenuItems() {
    let options1 = {mealCategory: "lunch", house: "harmony hill", allergens: ["nuts"]};
    const lunchMenuItemsWithoutNuts = await get(options1);
    
    let options2 = {mealCategory: "lunch", house: "jungle nook", allergens: []};
    const lunchMenuItems = await get(options2);
}
