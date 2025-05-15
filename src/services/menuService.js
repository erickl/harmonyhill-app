import * as menuDao from '../dao/menuDao.js';


/**
 * filters = {
 *      mealCategory: "breakfast"|"lunch"|"dinner"
 *      allergens:    ["gluten", "soy", "nuts", ...]
 *      house:        "harmony hill"|"jungle nook"
 * }
 */
export async function get(options = {}) {
    const menu = await menuDao.get(options);
    return menu;
    
}

export async function getMealOptions(mealCategory, house, allergens = []) {
    const options = {
        mealCategory: mealCategory,
        house: house,
        allergens: allergens
    };
    const menu = await get(options);
    return menu;
}
