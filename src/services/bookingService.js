import * as bookingDao from "../daos/bookingDao.js";
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import {transaction} from "../daos/dao.js";
import * as activityService from "./activityService.js";

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

async function addCheckIn(bookingId, booking, onError) {
     const checkInData = {
        category      : "service",
        subCategory   : "checkin",
        isFree        : true,
        customerPrice : 0,
        status        : booking.checkInTime ? activityService.Status.GUEST_CONFIRMED : activityService.Status.PENDING_GUEST_CONFIRM,
        needsProvider : false,
        startingAt    : booking.checkInAt,
        startingTime  : booking.checkInTime,

    }

    const addCheckInResult = await activityService.add(bookingId, checkInData, onError);
    if(addCheckInResult === false) {
        throw new Error(`Couldn't add check in data for booking ${bookingId}`);
    }

    return true;
}

async function addCheckOut(bookingId, booking, onError) {
     const checkOutData = {
        category      : "service",
        subCategory   : "checkout",
        isFree        : true,
        customerPrice : 0,
        status        : booking.checkOutTime ? activityService.Status.GUEST_CONFIRMED : activityService.Status.PENDING_GUEST_CONFIRM,
        needsProvider : false,
        startingAt    : booking.checkOutAt,
        startingTime  : booking.checkOutTime,

    }

    const addCheckOutResult = await activityService.add(bookingId, checkOutData, onError);
    if(addCheckOutResult === false) {
        throw new Error(`Couldn't add checkout data for booking ${bookingId}`);
    }

    return true;
}

export async function add(bookingData, onError) {
    const result = transaction(async () => {
        const bookingObject = await mapBookingObject(bookingData);
        const bookingId = createBookingId(bookingObject.name, bookingObject.house, bookingObject.checkInAt);
        const addBookingSuccess = await bookingDao.add(bookingId, bookingObject, onError);
        if(addBookingSuccess === false) {
            throw new Error(`Couldn't update transaction`);   
        }

        // Todo: in progress. Might move this to firebase functions, to add them only the day before the event
        //const addCheckInResult = await addCheckIn(bookingId, bookingObject, onError);
        //const addCheckOutResult = await addCheckIn(bookingId, bookingObject, onError);

        return true;
    });

    return result;
}

export async function update(bookingId, bookingUpdateData, onError) {
    const result = transaction(async () => {
        const bookingUpdate = await mapBookingObject(bookingUpdateData);    
        const updateBookingSuccess = await bookingDao.update(bookingId, bookingUpdate, onError);
    });

    return result;
}

/**
 * Only admin can delete bookings. It will be logged in the deleted collection
 */
export async function remove(bookingId) {   
    if(userService.isAdmin()) {
        return await bookingDao.remove(bookingId);
    }
    return false;
}

export function createBookingId(guestName, house, checkInAt) {
    const yyMMdd = utils.to_YYMMdd(checkInAt);
    const houseShort = house.trim().toLowerCase() == "harmony hill" ? "hh" : "jn";
    guestName = guestName.trim().toLowerCase().replace(/ /g, "-")
    return `${yyMMdd}-${houseShort}-${guestName}-${Date.now()}`;
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
        }
    } catch(e) {
        onError(`Unexpected booking validation error: ${e.message}`);
        return true; // A bug shouldn't prevent you from submitting?
    }

    return true;
}
