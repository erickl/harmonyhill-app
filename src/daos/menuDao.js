import * as dao from './dao.js';

export async function get(options = {}) {
    let filters = [];

    if(Object.hasOwn(options, 'mealCategory')) {
        filters.push(where("mealCategories", "array-contains", options.mealCategory));
    }

    if(Object.hasOwn(options, 'house')) {
        filters.push(where("houseAvailability", "array-contains", options.house));
    }

    // E.g. when menu items go out of season
    filters.push(where("isAvailable", "==", true));

    let ordering = [orderBy("name", "asc")];

    let menu = [];

    try {
        menu = await dao.get(['menu'], filters, ordering);
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }

    // Remove any menu items which contain any of the given allergens
    let menuWithoutAllergens = [];
    if(Object.hasOwn(options, 'allergens')) {
        for(const item of menu) {
            let allergenic = false;
            for(const allergen of options.allergens) {
                if(item.allergens.includes(allergen)) { 
                    allergenic = true;
                    break;
                }
            }
            if(!allergenic) {
                menuWithoutAllergens.push(item);
            }
        }
    }

    // Remove any menu items which contain any of the given allergens
    // if (Object.hasOwn(options, 'allergens')) {
    //     menuWithoutAllergens = menu.filter(item =>
    //         !options.allergens.some(allergen => item.allergens.includes(allergen))
    //     );
    // }
}