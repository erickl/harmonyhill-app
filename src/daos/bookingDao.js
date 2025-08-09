import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

export async function add(bookingRef, booking, onError) {
    return await dao.add([dao.constant.BOOKINGS], bookingRef, booking, onError);
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

    if (Object.hasOwn(filterOptions, "house")) {
        queryFilter.push(where("house", "==", filterOptions.house));
    }
    if (Object.hasOwn(filterOptions, "date")) {
        const fireStoreDate = utils.toFireStoreTime(filterOptions.date);
        queryFilter.push(where("checkInAt", "<=", fireStoreDate));
        queryFilter.push(where("checkOutAt", ">=", fireStoreDate));
    }

    if (Object.hasOwn(filterOptions, "after")) {
        const afterDateFireStore = utils.toFireStoreTime(filterOptions.after);
        queryFilter.push(where("checkOutAt", ">=", afterDateFireStore));
    }

    if (Object.hasOwn(filterOptions, "before")) {
        const beforeDateFireStore = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("checkInAt", "<=", beforeDateFireStore));
    }

    let ordering = [ orderBy("checkInAt", "asc") ];
    return await dao.get(path, queryFilter, ordering, onError);
}

export async function remove(bookingId) {
    return await dao.remove([dao.constant.BOOKINGS], bookingId);
}

export async function getPromotions() {
    return await dao.get([dao.constant.PROMOTIONS]);
}
