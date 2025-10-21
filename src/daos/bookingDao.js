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
