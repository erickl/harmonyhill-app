import * as activityService from "./activityService.js";
import * as menuService from "./menuService.js";
import * as activityDao from "../daos/activityDao.js";

export async function add(bookingId, activityId, type, minibar, onError) {
    // refill a json object of key-value pairs: {name: quantity, etc}
    // can we put it like that in the minibar doc?
    minibar.type = type;
    minibar.bookingId = bookingId;
    const result = await activityDao.addMinibar(bookingId, activityId, minibar, onError);
    return result;
}

export async function getSelection(onError) {
    const filter = { meal: "minibar" };
    const minibarSelection = await menuService.get(filter, onError);
    return minibarSelection;
}
