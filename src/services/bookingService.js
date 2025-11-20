import * as bookingDao from "../daos/bookingDao.js";
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import * as activityService from "./activityService.js";
import * as mealService from "./mealService.js";
import * as minibarService from "./minibarService.js";
import {commitTx} from "../daos/dao.js";

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
export async function get(filterOptions = {}, onError = null) {
    const bookings = await bookingDao.get(filterOptions, onError);
    
    // return dates of a few different formats
    const formattedBookings = bookings.map((booking) => {
        const newBooking = booking;
        newBooking.checkInAt_wwwddMMM = utils.to_www_ddMMM(booking.checkInAt);
        newBooking.checkOutAt_wwwddMMM = utils.to_www_ddMMM(booking.checkOutAt);

        newBooking.checkInAt = utils.toDateTime(booking.checkInAt);
        newBooking.checkOutAt = utils.toDateTime(booking.checkOutAt);

        newBooking.nightsCount = calculateNightsStayed(booking.checkInAt, booking.checkOutAt);
        newBooking.guestPaid = booking.guestPaid * booking.nightsCount;

        newBooking.checkInAt = booking.checkInAt.startOf('day');
        newBooking.checkOutAt = booking.checkOutAt.startOf('day');

        return newBooking;
    });
    
    return formattedBookings;
}

export function calculateNightsStayed(checkInAtInput, checkOutAtInput) {
    let checkInAt = utils.toDateTime(checkInAtInput);
    let checkOutAt = utils.toDateTime(checkOutAtInput);
    checkInAt = checkInAt.startOf('day');
    checkOutAt = checkOutAt.startOf('day');
    const diffInDays = checkOutAt.diff(checkInAt, 'days');
    return diffInDays.days;
}

export async function add(bookingData, onError, writes = []) {
    const commit = writes.length === 0;
    const bookingObject = await mapBookingObject(bookingData);
    const result = await bookingDao.add(bookingObject, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }
    return result;
}

export async function update(bookingId, bookingUpdateData, onError, writes = []) {
    const commit = writes.length === 0;
    
    const bookingUpdate = await mapBookingObject(bookingUpdateData);    
    const result = await bookingDao.update(bookingId, bookingUpdate, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

/**
 * Only admin can delete bookings. It will be logged in the deleted collection
 */
export async function remove(bookingId, onError, writes = []) {   
    if(!userService.isAdmin()) return false;
    const commit = writes.length === 0;

    // To delete a booking, first delete all its activities, or they'll be dangling records (orphaned)
    const activities = await activityService.get(bookingId);
    for(const activity of activities) {
        let deleteActivityResult = false;
        
        // Removing it as a meal, will also remove its dishes
        if(activity.category === "meal") {
            deleteActivityResult = await mealService.removeMeal(activity, onError, writes);
        } else {
            const removeMinibarResult = await minibarService.remove(activity, onError, writes);
            if(removeMinibarResult === false) {
                return false;
            }
            deleteActivityResult = await activityService.remove(activity, onError, writes);
        }
        
        if(!deleteActivityResult) {
            return false;
        }
    }

    const result = await bookingDao.remove(bookingId, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    
    return result;
}

export async function mapBookingObject(data) {
    let booking = {};

    if(utils.isString(data?.dietaryRestrictions)) booking.dietaryRestrictions    = data.dietaryRestrictions    ;
    if(utils.isString(data?.country))             booking.country                = data.country.toLowerCase();  
    if(utils.isString(data?.customerInfo))        booking.customerInfo           = data.customerInfo ;
    if(utils.isString(data?.arrivalInfo))         booking.arrivalInfo            = data.arrivalInfo  ;
    if(utils.isString(data?.specialRequests))     booking.specialRequests        = data.specialRequests ;
    if(utils.isString(data?.promotions))          booking.promotions             = data.promotions   ;
    if(utils.isString(data?.source))              booking.source                 = data.source.toLowerCase();       
    if(utils.isString(data?.status))              booking.status                 = data.status.toLowerCase();       
    if(utils.isString(data?.house))               booking.house                  = data.house.toLowerCase();        
    if(utils.isString(data?.name))                booking.name                   = data.name         ;
    if(utils.isString(data?.phoneNumber))         booking.phoneNumber            = data.phoneNumber  ;
    if(utils.isString(data?.email))               booking.email                  = data.email        ;

    if(!utils.isEmpty(data?.guestCount))          booking.guestCount             = data.guestCount   ;
    
    if(utils.isAmount(data?.roomRate))            booking.roomRate               = data.roomRate     ;
    if(utils.isAmount(data?.guestPaid))           booking.guestPaid              = data.guestPaid / data.nightsCount;
    if(utils.isAmount(data?.hostPayout))          booking.hostPayout             = data.hostPayout   ;
            
    if(utils.isDate(data?.checkInAt))             booking.checkInAt              = utils.toFireStoreTime(data.checkInAt)    ;
    if(utils.isDate(data?.checkOutAt))            booking.checkOutAt             = utils.toFireStoreTime(data.checkOutAt)   ;

    // Date is obligatory, but time might be set later, so might be null
    if(utils.exists(data, "checkInTime")) {
        booking.checkInTime = utils.isDate(data?.checkInTime) ? utils.toFireStoreTime(data.checkInTime) : null;
    }

    // Date is obligatory, but time might be set later, so might be null
    if(utils.exists(data, "checkOutTime")) {
        booking.checkOutTime = utils.isDate(data?.checkOutTime) ? utils.toFireStoreTime(data.checkOutTime) : null;
    }

    return booking;
}

export function validate(data, onError) {
    try {
        if(utils.isEmpty(data)) {
            onError("Fill in all required fields to submit");
            return false;
        }

        if(utils.isEmpty(data.checkInAt)) {
            onError("Check-in date is empty");
            return false;
        }

        if(utils.isEmpty(data.checkOutAt)) {
            onError("Check-out date is empty");
            return false;
        }

        if(data.checkOutAt < data.checkInAt) {
            onError("Check-out date must be after check-in date");
            return false;
        }

        if(utils.isEmpty(data.name.trim()) || !utils.isString(data.name)) {
            onError("Booking name missing");
            return false;
        }

        if(utils.isEmpty(data.house.trim()) || !utils.isString(data.house)) {
            onError("Choose a house for the booking");
            return false;
        }

        if(utils.isEmpty(data.country.trim()) || !utils.isString(data.country)) {
            onError("Country is missing");
            return false;
        }

        if(!utils.isNumber(data.roomRate) || data.roomRate == 0) {
            onError("Room rate is missing");
            return false;
        }

        if(!utils.isNumber(data.guestPaid) || data.guestPaid == 0) {
            onError("Guest paid amount is missing");
            return false;
        }

        if(!utils.isNumber(data.hostPayout) || data.hostPayout == 0) {
            onError("Host payout amount is missing");
            return false;
        }

        if(!utils.isString(data.source)) {
            onError("Booking source data type wrong");
            return false;
        }

        const source = data.source ? data.source.trim().toLowerCase() : "";

        if(utils.isEmpty(source)) {
            onError("Booking source missing");
            return false;
        }

        if(source === "airbnb") {
            const guestPaidPerNight = data.guestPaid / data.nightsCount;
            // Room rate is excluding AirBnB added fee
            if(data.roomRate >= guestPaidPerNight) {
                onError("Room rate should be less than what guest paid per night, for an AirBnB booking");
                return false;
            }
            // Payout from AirBnB smaller since AirBnB takes a piece
            if(data.hostPayout >= data.guestPaid) {
                onError("Host payout should be less than what guest paid total, for an AirBnB booking");
                return false;
            }
        } else if(source === "direct") {
            const roomRateAllNights = data.roomRate * data.nightsCount;
            if(roomRateAllNights != data.guestPaid) {
                onError("Total room cost should be equal to what guest paid total, for a direct booking");
                return false;
            }

            // If direct, we keep the entire payment
            if(data.hostPayout != data.guestPaid) {
                onError("Host payout should be equal to what guest paid total, for a direct booking");
                return false;
            }
        } else if(source === "booking.com") {
            // todo: implement checks
        }
    } catch(e) {
        onError(`Unexpected booking validation error: ${e.message}`);
        return true; // A bug shouldn't prevent you from submitting?
    }

    return true;
}
