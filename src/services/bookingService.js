import * as bookingDao from "../daos/bookingDao.js";

export async function get(id = null) {
    const guests = await bookingDao.get(id);
    return guests;
}

export async function filter(filterOptions = []) {
    const guests = await bookingDao.get(filterOptions);
    return guests;
}

export async function add(bookingData) {
    const bookingObject = createBookingObject(bookingData);
    const bookingRef = createBookingId(bookingObject.name, bookingObject.house, bookingObject.checkInDate);
    const success = await bookingDao.add(bookingRef, bookingObject);
    if(success) {
        return bookingRef;
    }
    else {
        return null;
    }
}

export async function update(bookingRef, bookingUpdateData) {
    const success = bookingDao.update(bookingRef, bookingUpdateData);
    return success;
}

export function createBookingId(guestName, house, checkInDate) {
    const year = checkInDate.getFullYear() - 2000;
    const yyMmdd = `${year}${checkInDate.getMonth()}${checkInDate.getDate()}`;
    return guestName.replace(/ /g, "-") + "-" + house.replace(/ /g, "-") + "-" + yyMmdd.replace(/ /g, "-");
}

function createBookingObject(data) {
    let booking = {
        allergies: Object.hasOwn(data, "allergies") ? data.allergies : "",
        checkInDate: Object.hasOwn(data, "checkInDate") ? data.checkInDate : "",
        checkOutDate: Object.hasOwn(data, "checkOutDate") ? data.checkOutDate : "",
        country: Object.hasOwn(data, "country") ? data.country : "",
        guestCount: Object.hasOwn(data, "guestCount") ? data.guestCount : 0,
        otherDetails: Object.hasOwn(data, "otherDetails") ? data.otherDetails : "",
        promotions: Object.hasOwn(data, "promotions") ? data.promotions : "",
        roomRate: Object.hasOwn(data, "roomRate") ? data.roomRate : 0,
        source: Object.hasOwn(data, "source") ? data.source : "",
        status: Object.hasOwn(data, "status") ? data.status : "",
        house: Object.hasOwn(data, "house") ? data.house : "",
        name: Object.hasOwn(data, "name") ? data.name : "",      
    };

    return booking;
}

export async function test() {
    let booking = {
        allergies: "sausage",
        checkInDate: new Date(2025, 10, 10, 14, 0, 0),
        checkOutDate: new Date(2025, 10, 12, 11, 0, 0),
        country: "Norway",
        guestCount: 4,
        otherDetails: "none",
        promotions: "none",
        roomRate: 10000000,
        source: "AirBnB",
        status: "confirmed",
        house: "Harmony Hill",
        name: "Eric Klaesson",              
    };

    const ref = await add(booking);

    let bookingUpdate = {
        allergies: "sausage",
        checkInDate: new Date(2025, 10, 10, 14, 0, 0),
        checkOutDate: new Date(2025, 10, 12, 11, 0, 0),
        country: "Norway",
        guestCount: 4,
        otherDetails: "updated",
        promotions: "updated",
        roomRate: 10000000,
        source: "AirBnB",
        status: "confirmed",
        house: "Harmony Hill",
        name: "Eric Klaesson",        
    }
    
    const success = await update(ref, bookingUpdate);

    const linnieBooking = await get(ref);

    let x = 1;
}