import * as dao from './dao.js';
import * as utils from "../utils.js";
import { where, orderBy } from 'firebase/firestore';

export async function getOne(id, onError) {
    return await dao.getOne(["menu"], id, onError)
}

export async function update(id, data, onError, writes) {
    return await dao.update(['menu'], id, data, true, onError, writes);
}

export async function add(data, onError, writes) {
    const id = makeId(data);
    return await dao.add(['menu'], id, data, onError, writes);
}

export async function get(options = {}, onError) {
    try {
        let filters = [];

        if(utils.exists(options, 'isFavorite')) {
            filters.push(where("isFavorite", "==", options.isFavorite));
        }

        if(utils.exists(options, 'name')) {
            filters.push(where("name", "==", options.name));
        }

        // E.g. when menu items go out of season
        filters.push(where("isAvailable", "==", true));

        let ordering = [orderBy("name", "asc")];

        let menu = await dao.get(['menu'], filters, ordering, -1, onError);
    
        // Cannot have more than 1 array-contains filter in one firestore query (??), so we'll do it manually here instead 
        if(utils.exists(options, 'meal')) {
            menu = menu.filter(item => item.meals.includes(options.meal));
        }

        if(utils.exists(options, 'house')) {
            menu = menu.filter(item => item.houseAvailability.includes(options.house));
        }

        // Remove any menu items which contain any of the given allergens
        if (utils.exists(options, 'allergens')) {
            menu = menu.filter(item =>
                !options.allergens.some(allergen => item.allergens.includes(allergen))
            );
        }

        return menu;
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }
}

export async function remove(item, onError, writes) {
    return await dao.remove(['menu'], item.id, onError, writes);

}

function makeId(data) {
    const name = utils.isString(data.name) ? data.name.toLowerCase().replace(/ /g, "-") : "";
    const mealsShort = data.meals.map((meal) => {
        switch(meal) {
            case "lunch": return "lu";
            case "dinner": return "di";
            case "breakfast": return "bf";
            case "extra": return "ex";
            case "afternoon-tea": return "at";
            case "snack": return "sn";
            default: return meal;
        }
    });
    const mealsJoined = mealsShort.join("-");
    return `${name}-${mealsJoined}`.replace(/ /g, "-");
}
