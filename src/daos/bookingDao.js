import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

export async function add(booking, onError) {
    const bookingId = createBookingId(booking.name, booking.house, booking.checkInAt);
    return await dao.add([dao.constant.BOOKINGS], bookingId, booking, onError);
}

export async function update(bookingId, bookingUpdate, onError) {
    return await dao.update([dao.constant.BOOKINGS], bookingId, bookingUpdate, true, onError);
}

export async function getOne(id) {
    return await dao.getOne([dao.constant.BOOKINGS], id);
}

export async function get(filterOptions = {}, onError = null) {
    let path = [dao.constant.BOOKINGS];
    let queryFilter = [];

    if (utils.exists(filterOptions, "house")) {
        queryFilter.push(where("house", "==", filterOptions.house));
    }
    
    if (utils.exists(filterOptions, "date")) {
        const fireStoreDate = utils.toFireStoreTime(filterOptions.date);
        queryFilter.push(where("checkInAt", "<=", fireStoreDate));
        queryFilter.push(where("checkOutAt", ">=", fireStoreDate));
    }

    if (utils.exists(filterOptions, "after")) {
        const afterDateFireStore = utils.toFireStoreTime(filterOptions.after);
        queryFilter.push(where("checkOutAt", ">=", afterDateFireStore));
    }

    if (utils.exists(filterOptions, "before")) {
        const beforeDateFireStore = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("checkInAt", "<=", beforeDateFireStore));
    }

    let ordering = [ orderBy("checkInAt", "asc") ];
    return await dao.get(path, queryFilter, ordering, -1, onError);
}

export async function remove(bookingId, onError) {
    return await dao.remove([dao.constant.BOOKINGS], bookingId, onError);
}

export async function getPromotions() {
    return await dao.get([dao.constant.PROMOTIONS], [], [], -1);
}

export async function addMinibar(booking, minibar, onError) {
    const path = [dao.constant.BOOKINGS, booking.id, dao.constant.MINIBAR];
    const houseShort = getHouseShortName(booking.house);
    const id = `minibar-${minibar.type}-${houseShort}-${utils.to_YYMMdd()}-${Date.now()}`;
    return await dao.add(path, id, minibar, onError);
}

export async function updateMinibar(bookingId, minibarId, updatedData, onError) {
    const path = [dao.constant.BOOKINGS, bookingId, "minibar"];
    return await dao.update(path, minibarId, updatedData, true, onError);
}

export async function getExistingMinibar(minibar, onError) {
    const path = [dao.constant.BOOKINGS, minibar.bookingId, dao.constant.MINIBAR];
    const queryFilter = [
        where("activityId", "==", minibar.activityId),
        where("type", "==", minibar.type)
    ];
    const existingResults = await dao.get(path, queryFilter, [], -1, onError);
    if(!existingResults || existingResults.length < 1) {
        return null;
    }
    return existingResults[0];
}

export async function getMinibar(booking, filterOptions, onError) {
    const path = [dao.constant.BOOKINGS, booking.id, dao.constant.MINIBAR];
    let queryFilter = [];

    if (utils.exists(filterOptions, "type")) {
        queryFilter.push(where("type", "==", filterOptions.type));
    }

    if (utils.exists(filterOptions, "bookingId")) {
        queryFilter.push(where("bookingId", "==", filterOptions.bookingId));
    }

    if (utils.exists(filterOptions, "activityId")) {
        queryFilter.push(where("activityId", "==", filterOptions.activityId));
    }

    return await dao.get(path, queryFilter, [], -1, onError);
}

export function createBookingId(guestName, house, checkInAt) {
    const yyMMdd = utils.to_YYMMdd(checkInAt);
    const houseShort = getHouseShortName(house);
    guestName = guestName.trim().toLowerCase().replace(/ /g, "-")
    return `${yyMMdd}-${houseShort}-${guestName}-${Date.now()}`;
}

export function getHouseShortName(houseName) {
    const houseShort = houseName.trim().toLowerCase() === "harmony hill" ? "hh" : "jn";
    return houseShort;
}
