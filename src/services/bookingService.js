import * as bookingDao from "../daos/bookingDao.js";

export async function getOne(id) {
    const booking = await bookingDao.getOne(id);
    return booking;
}

// todo: maybe "house" should be an input
export async function getPromotions() {
    return await bookingDao.getPromotions();
}

/**
 * house=Harmony Hill|Jungle Nook
 * date=Date object (new Date(...)) the date can be any date which is between checkInAt and checkOutAt (inclusive range)
 */
export async function get(filterOptions = {}) {
    const bookings = await bookingDao.get(filterOptions);
    return bookings;
}

export async function add(bookingData) {
    const bookingObject = createBookingObject(bookingData);
    const bookingId = createBookingId(bookingObject.name, bookingObject.house, bookingObject.checkInAt);
    const success = await bookingDao.add(bookingId, bookingObject);
    if(success) {
        return bookingId;
    }
    else {
        return false;
    }
}

/**
 * Cannot update createdAt date
 */
export async function update(bookingId, bookingUpdateData) {
    if(!Object.hasOwn(bookingUpdateData, "createdAt")) {
        delete bookingUpdateData.createdAt;
    }

    return await bookingDao.update(bookingId, bookingUpdateData);
}

/**
 * todo: Only admin should be able to delete bookings
 */
export async function deleteBooking(bookingId) {
    if(true /* isAdmin*/) {
        return await bookingDao.deleteBooking(bookingId);
    }
    return false;
}

export function createBookingId(guestName, house, checkInAt) {
    const year = checkInAt.getFullYear() - 2000;
    const yyMmdd = `${year}${checkInAt.getMonth()}${checkInAt.getDate()}`;
    const houseShort = house == "Harmony Hill" ? "hh" : "jn";

    return guestName.replace(/ /g, "-") + "-" + houseShort + "-" + yyMmdd.replace(/ /g, "-");
}

function createBookingObject(data) {
    let booking = {
        allergies    :  Object.hasOwn(data, "allergies")    ? data.allergies    : "",
        checkInAt    :  Object.hasOwn(data, "checkInAt")    ? data.checkInAt    : "",
        checkOutAt   :  Object.hasOwn(data, "checkOutAt")   ? data.checkOutAt   : "",
        country      :  Object.hasOwn(data, "country")      ? data.country      : "",
        guestCount   :  Object.hasOwn(data, "guestCount")   ? data.guestCount   : 0 ,
        otherDetails :  Object.hasOwn(data, "otherDetails") ? data.otherDetails : "",
        promotions   :  Object.hasOwn(data, "promotions")   ? data.promotions   : "",
        roomRate     :  Object.hasOwn(data, "roomRate")     ? data.roomRate     : 0 ,
        guestPaid    :  Object.hasOwn(data, "guestPaid")    ? data.guestPaid    : 0 ,
        hostPayout   :  Object.hasOwn(data, "hostPayout")   ? data.hostPayout   : 0 ,
        source       :  Object.hasOwn(data, "source")       ? data.source       : "",
        status       :  Object.hasOwn(data, "status")       ? data.status       : "",
        house        :  Object.hasOwn(data, "house")        ? data.house        : "",
        name         :  Object.hasOwn(data, "name")         ? data.name         : "",

        createdAt    :  new Date(), 
    };

    return booking;
}

export async function testBooking() {
    let booking = {
        allergies: "sausage",
        checkInAt: new Date(2025, 10, 10, 14, 0, 0),
        checkOutAt: new Date(2025, 10, 12, 11, 0, 0),
        createdAt: new Date(),
        country: "Norway",
        guestCount: 4,
        otherDetails: "none",
        promotions: "none",
        roomRate: 10000000,
        guestPaid: 1200000,
        hostPayout: 800000,
        source: "AirBnB",
        status: "confirmed",
        house: "Harmony Hill",
        name: "Eric Klaesson",              
    };

    const ref = await add(booking);

    let bookingUpdate = {
        allergies: "sausage",
        checkInAt: new Date(2025, 10, 10, 14, 0, 0),
        checkOutAt: new Date(2025, 10, 12, 11, 0, 0),
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