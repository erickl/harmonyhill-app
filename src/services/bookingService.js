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
    
    // return dates of a few different formats
    bookings.map((booking) => {
        booking.checkInAt_ddMMM = utils.YYMMdd_to_ddMMM(booking.checkInAt);
        booking.checkOutAt_ddMMM = utils.YYMMdd_to_ddMMM(booking.checkOutAt);
    });
    
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
 * Cannot update createdAt or createdBy
 */
export async function update(bookingId, bookingUpdateData) {
    const bookingUpdate = mapBookingObject(bookingUpdateData, true);

    // Remove any fields which should not be updated
    if(Object.hasOwn(bookingUpdate, "createdAt")) {
        delete bookingUpdate.createdAt;
    }
    if(Object.hasOwn(bookingUpdate, "createdBy")) {
        delete bookingUpdate.createdBy;
    }

    return await bookingDao.update(bookingId, bookingUpdate);
}

/**
 * Only admin can delete bookings
 */
export async function deleteBooking(bookingId) {   
    const isAdmin = userService.isAdmin();
    if(isAdmin) {
        return await bookingDao.deleteBooking(bookingId);
    }
    return false;
}

export function createBookingId(guestName, house, checkInAt) {
    const yyMmdd = utils.getDateStringYYMMdd(checkInAt);
    const houseShort = house == "Harmony Hill" ? "hh" : "jn";

    return guestName.replace(/ /g, "-") + "-" + houseShort + "-" + yyMmdd;
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
    // const xx  = utils.YYMMdd_to_ddMMM("20250101");
    // const x2  = utils.YYMMdd_to_ddMMM("250101");

    //const signUpSuccess = userService.signUp("ericklaesson", "ericklaesson@gmail.com", "password");
    //const signInSuccess = await userService.login("ericklaesson@gmail.com", "password");

    const all = await get();

    let booking = {
        allergies: "sausage",
        checkInAt: "2025-05-10",
        checkOutAt: "2025-05-13",
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
        name: "Boerje Ingvar",              
    };

    const ref = await add(booking);

    let bookingUpdate = {
        allergies: "sausage",
        country: "Norway",
        guestCount: 4,
        otherDetails: "updated",
        promotions: "updated",
        source: "AirBnB",
        status: "confirmed",
        house: "Harmony Hill",      
    }
    
    const updateSuccess = await update(ref, bookingUpdate);

    //const deleteSuccess = await deleteBooking(ref);

    let x = 1;
}
