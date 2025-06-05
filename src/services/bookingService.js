import * as bookingDao from "../daos/bookingDao.js";
import * as utils from "../utils.js";
import * as userService from "./userService.js";

export async function getOne(id) {
    const booking = await bookingDao.getOne(id);
    return booking;
}

export async function getHouse(bookingId) {
    const booking = await bookingDao.getOne(bookingId);
    if(booking) {
        return booking.house;
    }
    return "";
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
        booking.checkInAt_ddMMM = utils.to_ddMMM(booking.checkInAt);
        booking.checkOutAt_ddMMM = utils.to_ddMMM(booking.checkOutAt);

        booking.checkInAt = utils.fromFireStoreTime(booking.checkInAt);
        booking.checkOutAt = utils.fromFireStoreTime(booking.checkOutAt);

        booking.nightsCount = (booking.checkOutAt - booking.checkInAt) / (1000 * 60 * 60 * 24);

        booking.checkInAt = booking.checkInAt.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        booking.checkOutAt = booking.checkOutAt.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    });
    
    return bookings;
}

export async function add(bookingData) {
    const bookingObject = await mapBookingObject(bookingData);
    const bookingId = createBookingId(bookingObject.name, bookingObject.house, bookingObject.checkInAt);
    const success = await bookingDao.add(bookingId, bookingObject);
    if(success) {
        return bookingId;
    }
    else {
        return false;
    }
}

export async function update(bookingId, bookingUpdateData) {
    const bookingUpdate = await mapBookingObject(bookingUpdateData, true);
    return await bookingDao.update(bookingId, bookingUpdate);
}

/**
 * Only admin can delete bookings. It will be logged in the deleted collection
 */
export async function deleteBooking(bookingId) {   
    if(userService.isAdmin()) {
        return await bookingDao.deleteBooking(bookingId);
    }
    return false;
}

export function createBookingId(guestName, house, checkInAt) {
    const yyMMdd = utils.to_YYMMdd(checkInAt);
    const houseShort = house == "Harmony Hill" ? "hh" : "jn";
    return yyMMdd + "-" + houseShort + "-" + guestName.replace(/ /g, "-");
}

async function mapBookingObject(data, isUpdate = false) {
    let booking = {};

    if(Object.hasOwn(data, "allergies"))    booking.allergies    = data.allergies    ;
    if(Object.hasOwn(data, "checkInAt"))    booking.checkInAt    = data.checkInAt    ;
    if(Object.hasOwn(data, "checkOutAt"))   booking.checkOutAt   = data.checkOutAt   ;
    if(typeof data?.country === "string")   booking.country      = data.country.toLowerCase();
    if(Object.hasOwn(data, "guestCount"))   booking.guestCount   = data.guestCount   ;
    if(Object.hasOwn(data, "otherDetails")) booking.otherDetails = data.otherDetails ;
    if(Object.hasOwn(data, "promotions"))   booking.promotions   = data.promotions   ;
    if(Object.hasOwn(data, "roomRate"))     booking.roomRate     = data.roomRate     ;
    if(Object.hasOwn(data, "guestPaid"))    booking.guestPaid    = data.guestPaid    ;
    if(Object.hasOwn(data, "hostPayout"))   booking.hostPayout   = data.hostPayout   ;
    if(typeof data?.source === "string")    booking.source       = data.source.toLowerCase();       
    if(typeof data?.status === "string")    booking.status       = data.status.toLowerCase();       
    if(typeof data?.house === "string")     booking.house        = data.house.toLowerCase();        
    if(Object.hasOwn(data, "name"))         booking.name         = data.name         ;

    if(!isUpdate) {
        booking.createdAt = new Date(); 
        booking.createdBy = await userService.getUserName();
    }

    return booking;
}

export async function testBooking() {
    // const xx  = utils.to_ddMMM("20250101");
    // const x2  = utils.to_ddMMM("250101");

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
