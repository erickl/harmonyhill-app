import * as bookingDao from "../daos/bookingDao.js";
import * as utils from "../utils.js";
import * as userService from "./userService.js";

export async function getOne(id) {
    const booking = await bookingDao.getOne(id);
    return booking;
}

// todo: maybe "house" should be an input?
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
    const bookingObject = mapBookingObject(bookingData);
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
 * Creates and includes a change logs string in the new booking object
 * Cannot update createdAt or createdBy
 */
export async function update(bookingId, bookingUpdateData) {
    // Update booking update logs
    const booking = await bookingDao.getOne(bookingId);
    const bookingUpdate = mapBookingObject(bookingUpdateData, true);
    let diffStr = utils.jsonObjectDiffStr(booking, bookingUpdate);

    if(diffStr.length === 0) {
        console.log(`No changes to update to booking ${bookingId}`);
        return false;
    }

    bookingUpdate.updateLogs = Object.hasOwn(booking, "updateLogs") ? booking.updateLogs : [];
    bookingUpdate.updateLogs.push(diffStr);

    // Remove any fields which should not be updated
    if(Object.hasOwn(bookingUpdate, "createdAt")) {
        delete bookingUpdate.createdAt;
    }
    if(Object.hasOwn(bookingUpdate, "createdBy")) {
        delete bookingUpdate.createdBy;
    }

    // Run update
    return await bookingDao.update(bookingId, bookingUpdate);
}

/**
 * Only admin should be able to delete bookings
 */
export async function deleteBooking(bookingId) {   
    if(userService.isAdmin()) {
        return await bookingDao.deleteBooking(bookingId);
    }
    return false;
}

export function createBookingId(guestName, house, checkInAt) {
    const yyMmdd = utils.getDateString(checkInAt);
    const houseShort = house == "Harmony Hill" ? "hh" : "jn";

    return guestName.replace(/ /g, "-") + "-" + houseShort + "-" + yyMmdd.replace(/ /g, "-");
}

function mapBookingObject(data, isUpdate = false) {
    let booking = {};
    if(Object.hasOwn(data, "allergies"))    booking.allergies    = data.allergies    ;
    if(Object.hasOwn(data, "checkInAt"))    booking.checkInAt    = data.checkInAt    ;
    if(Object.hasOwn(data, "checkOutAt"))   booking.checkOutAt   = data.checkOutAt   ;
    if(Object.hasOwn(data, "country"))      booking.country      = data.country      ;
    if(Object.hasOwn(data, "guestCount"))   booking.guestCount   = data.guestCount   ;
    if(Object.hasOwn(data, "otherDetails")) booking.otherDetails = data.otherDetails ;
    if(Object.hasOwn(data, "promotions"))   booking.promotions   = data.promotions   ;
    if(Object.hasOwn(data, "roomRate"))     booking.roomRate     = data.roomRate     ;
    if(Object.hasOwn(data, "guestPaid"))    booking.guestPaid    = data.guestPaid    ;
    if(Object.hasOwn(data, "hostPayout"))   booking.hostPayout   = data.hostPayout   ;
    if(Object.hasOwn(data, "source"))       booking.source       = data.source       ;
    if(Object.hasOwn(data, "status"))       booking.status       = data.status       ;
    if(Object.hasOwn(data, "house"))        booking.house        = data.house        ;
    if(Object.hasOwn(data, "name"))         booking.name         = data.name         ;

    if(!isUpdate) {
        booking.createdAt = new Date(); 
        booking.createdBy = userService.getUserName();
    }

    return booking;
}

export async function testBooking() {
    const ss  = await get();

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