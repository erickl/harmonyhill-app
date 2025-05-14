import { where } from 'firebase/firestore';
import * as dao from "./dao.js"

export async function add(bookingRef, booking) {
    return await dao.add(["bookings"], bookingRef, booking);
}

export async function update(bookingId, bookingUpdate) {
    return await dao.update(["bookings"], bookingId, bookingUpdate);
}

export async function getOne(id) {
    return await dao.getOne(["bookings"], id);
}

export async function get(filterOptions = {}) {
    let path = ["bookings"];
    let queryFilter = [];

    if (Object.hasOwn(filterOptions, "house")) {
        queryFilter.push(where("house", "==", filterOptions.house));
    }
    if (Object.hasOwn(filterOptions, "date")) {
        queryFilter.push(where("checkInAt", "<=", filterOptions.date));
        queryFilter.push(where("checkOutAt", ">=", filterOptions.date));
    }
    return await dao.get(path, queryFilter);
}

export async function deleteBooking(bookingId) {
    return await dao.deleteDoc(["bookings"], bookingId);
}

export async function getPromotions() {
    return await dao.get(["promotions"]);
}
