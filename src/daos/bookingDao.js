import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";
import * as inventoryDao from "./inventoryDao.js";
import { filter } from 'jszip';

export function subscribe(setDocs, options, onError) {
    const path = [dao.constant.BOOKINGS];
    const queryFilter = createFirebaseQuery(options); 
    return dao.subscribe(path, setDocs, queryFilter, onError);
} 

export async function add(booking, onError, writes) {
    const bookingId = createBookingId(booking.name, booking.house, booking.checkInAt);
    return await dao.add([dao.constant.BOOKINGS], bookingId, booking, onError, writes);
}

export async function update(bookingId, bookingUpdate, onError, writes) {
    return await dao.update([dao.constant.BOOKINGS], bookingId, bookingUpdate, true, onError, writes);
}

export async function getOne(id) {
    return await dao.getOne([dao.constant.BOOKINGS], id);
}

export async function get(filterOptions = {}, onError = null) {
    let path = [dao.constant.BOOKINGS];
    const queryFilter = createFirebaseQuery(filterOptions); 
    let ordering = [ orderBy("checkInAt", "asc") ];
    return await dao.get(path, queryFilter, ordering, -1, onError);
}

export async function remove(bookingId, onError, writes) {
    return await dao.remove([dao.constant.BOOKINGS], bookingId, onError, writes);
}

export async function getPromotions() {
    return await dao.get([dao.constant.PROMOTIONS], [], [], -1);
}

export async function addMinibar(activity, minibar, onError, writes) {
    const path = [dao.constant.BOOKINGS, activity.bookingId, dao.constant.MINIBAR];
    const houseShort = getHouseShortName(activity.house);
    const id = `minibar-${minibar.type}-${houseShort}-${utils.to_YYMMdd()}-${Date.now()}`;
    return await dao.add(path, id, minibar, onError, writes);
}

export async function updateMinibar(bookingId, minibarId, updatedData, onError, writes) {
    const path = [dao.constant.BOOKINGS, bookingId, "minibar"];
    return await dao.update(path, minibarId, updatedData, true, onError, writes);
}

export async function removeMinibarCount(bookingId, minibarId, onError, writes) {
    const path = [dao.constant.BOOKINGS, bookingId, "minibar"];
    return await dao.remove(path, minibarId, onError, writes);
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

export async function getMinibarCounts(bookingId, filterOptions, onError) {
    const path = [dao.constant.BOOKINGS, bookingId, dao.constant.MINIBAR];
    let queryFilter = [];

    if (utils.exists(filterOptions, "type")) {
        queryFilter.push(where("type", "==", filterOptions.type));
    }

    if (utils.exists(filterOptions, "before")) {
        const before = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("createdAt", "<=", before));
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

function createFirebaseQuery(filterOptions = {}) {
    let queryArray = [];

    if (utils.exists(filterOptions, "house")) {
        queryArray.push(where("house", "==", filterOptions.house));
    }
    
    if (utils.exists(filterOptions, "date")) {
        const fireStoreDateBefore = utils.toFireStoreTime(filterOptions.date.endOf('day'));
        const fireStoreDateAfter = utils.toFireStoreTime(filterOptions.date.startOf('day'));
        queryArray.push(where("checkInAt", "<=", fireStoreDateBefore));
        queryArray.push(where("checkOutAt", ">=", fireStoreDateAfter));
    }

    if (utils.exists(filterOptions, "checkOutAfter")) {
        const checkOutAfterFireStore = utils.toFireStoreTime(filterOptions.checkOutAfter);
        queryArray.push(where("checkOutAt", ">=", checkOutAfterFireStore));
    }

    if (utils.exists(filterOptions, "checkOutBefore")) {
        const checkOutBeforeFireStore = utils.toFireStoreTime(filterOptions.checkOutBefore);
        queryArray.push(where("checkOutAt", "<=", checkOutBeforeFireStore));
    }

    if (utils.exists(filterOptions, "before")) {
        const checkOutBeforeFireStore = utils.toFireStoreTime(filterOptions.before);
        queryArray.push(where("checkOutAt", "<=", checkOutBeforeFireStore));
    }

    if (utils.exists(filterOptions, "after")) {
        const checkInAfterFireStore = utils.toFireStoreTime(filterOptions.after);
        queryArray.push(where("checkInAt", ">=", checkInAfterFireStore));
    }

    if (utils.exists(filterOptions, "checkInAfter")) {
        const checkInAfterFireStore = utils.toFireStoreTime(filterOptions.checkInAfter);
        queryArray.push(where("checkInAt", ">=", checkInAfterFireStore));
    }

    if (utils.exists(filterOptions, "checkInBefore")) {
        const checkInBeforeFireStore = utils.toFireStoreTime(filterOptions.checkInBefore);
        queryArray.push(where("checkInAt", "<=", checkInBeforeFireStore));
    }

    return queryArray;
}
