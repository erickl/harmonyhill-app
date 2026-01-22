import * as utils from "@harmonyhill/shared/utils.js";
//import { makeAdapter } from "../db-adapter.js";

export function createService(booking = null, subCategory = null) {
    const serviceActivity = {
        category      : "service",
        isFree        : true,
        needsProvider : false,
        status        : "guest confirmed",
        createdAt     : new Date(),
        createdBy     : "system",
    };

    if(subCategory) serviceActivity.subCategory = subCategory;

    if(booking) {
        serviceActivity.house       = booking.house;
        serviceActivity.bookingId   = booking.id;
        serviceActivity.name        = booking.name;

        if(serviceActivity.subCategory === "checkin") {
            serviceActivity.startingAt = booking.checkInAt;
            serviceActivity.startingTime = booking.checkInTime;

            if(utils.exists(booking, "comments"))        checkIn.comments        = booking.comments;
            if(utils.exists(booking, "customerInfo"))    checkIn.customerInfo    = booking.customerInfo;
            if(utils.exists(booking, "specialRequests")) checkIn.specialRequests = booking.specialRequests;
            if(utils.exists(booking, "promotions"))      checkIn.promotions      = booking.promotions;
            if(utils.exists(booking, "arrivalInfo"))     checkIn.arrivalInfo     = booking.arrivalInfo;
        } else if(serviceActivity.subCategory === "checkout") {
            serviceActivity.startingAt = booking.checkOutAt;
            serviceActivity.startingTime = booking.checkOutTime;
        }
    }

    return serviceActivity;
};

export function createActivityCollectionPath(booking) {
    if(!booking) return null;
    return `bookings/${booking.id}/activities`;
}
