import * as dao from './dao.js';
import * as utils from "../utils.js";
import { where, orderBy } from 'firebase/firestore';

export async function getOne(id) {
    return await dao.getOne(id)
}

export async function get(options = {}) {
    let filters = [];

    if(Object.hasOwn(options, 'isFavorite')) {
        filters.push(where("isFavorite", "==", options.isFavorite));
    }

    if(Object.hasOwn(options, 'name')) {
       filters.push(where("name", "==", options.name));
    }

    // E.g. when menu items go out of season
    filters.push(where("isAvailable", "==", true));

    let ordering = [orderBy("name", "asc")];

    let menu = [];

    try {
        menu = await dao.get(['menu'], filters, ordering, -1);
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }

    // Cannot have more than 1 array-contains filter in one firestore query (??), so we'll do it manually here instead 
    if(Object.hasOwn(options, 'meal')) {
        menu = menu.filter(item => item.meals.includes(options.meal));
    }

    if(Object.hasOwn(options, 'house')) {
        menu = menu.filter(item => item.houseAvailability.includes(options.house));
    }

    // Remove any menu items which contain any of the given allergens
    if (Object.hasOwn(options, 'allergens')) {
        menu = menu.filter(item =>
            !options.allergens.some(allergen => item.allergens.includes(allergen))
        );
    }

    return menu;
}
