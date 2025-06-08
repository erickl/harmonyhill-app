import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js"

export async function add(bookingRef, booking) {
    return await dao.add([dao.constant.BOOKINGS], bookingRef, booking);
}

export async function update(bookingId, bookingUpdate) {
    return await dao.update([dao.constant.BOOKINGS], bookingId, bookingUpdate);
}

export async function getOne(id) {
    return await dao.getOne([dao.constant.BOOKINGS], id);
}

export async function get(filterOptions = {}) {
    let path = [dao.constant.BOOKINGS];
    let queryFilter = [];

    if (Object.hasOwn(filterOptions, "house")) {
        queryFilter.push(where("house", "==", filterOptions.house));
    }
    if (Object.hasOwn(filterOptions, "date")) {
        queryFilter.push(where("checkInAt", "<=", utils.toFireStoreTime(filterOptions.date)));
        queryFilter.push(where("checkOutAt", ">=", utils.toFireStoreTime(filterOptions.date)));
    }

    let ordering = [ orderBy("checkInAt", "asc") ];
    return await dao.get(path, queryFilter, ordering);
}

export async function deleteBooking(bookingId) {
    return await dao.remove([dao.constant.BOOKINGS], bookingId);
}

export async function getPromotions() {
    return await dao.get([dao.constant.PROMOTIONS]);
}
