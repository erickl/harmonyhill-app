import * as calUtils from "../utils/calendar.js";
import * as config from "../config/config.js";
import * as utils from "@harmonyhill/shared/utils.js";
import { makeFirestoreAdapter } from "@harmonyhill/shared/firestoreAdapter.js";
import {db, Timestamp} from "../admin-firebase.js";
import { onSchedule } from "firebase-functions/v2/scheduler";

// Upload calendar comparison result which compares booking.com & airbnb to our own internal calendar
export const hourlyJob = onSchedule("every 15 minutes", async (event) => {
    const result = await compareCalendars();
    if(result === false) {
        console.log("Couldn't create calendar comparison notification", new Date().toISOString());
        return false;
    }

    const adapter = await makeFirestoreAdapter(db, Timestamp);

    result.createdAt = utils.now();
    const addNotificationResult = adapter.add("notifications", "calendar-check-result", result);
    
    if(addNotificationResult !== false) {
        console.log("⏰ Calendar comparison done", new Date().toISOString());
    } else {
        console.log("Couldn't create calendar comparison notification", new Date().toISOString());
    }
});

export const compareCalendars = async() => {
    const bookingIsSame = (booking1, booking2) => {
        return utils.dateIsSame(booking1.checkInAt, booking2.checkInAt, true) &&
               utils.dateIsSame(booking1.checkOutAt, booking2.checkOutAt, true);
    }

    const airbnbBookings = await getCalendar(config.AIRBNB_CALENDAR_HH);
    if(airbnbBookings === false) return false;
    //const airbnbBookingsStrings = airbnbBookings.map((b) => {return {start: utils.to_YYMMdd(b.checkInAt, "-"), end: utils.to_YYMMdd(b.checkOutAt, "-")}});
    
    const bookingComBookings = await getCalendar(config.BOOKING_COM_CALENDAR_HH);
    if(bookingComBookings === false) return false;
    //const bookingComBookingsStrings = bookingComBookings.map((b) => {return {start: utils.to_YYMMdd(b.checkInAt, "-"), end: utils.to_YYMMdd(b.checkOutAt, "-")} });

    const internalBookingsFilter = [["checkInAt", ">=", utils.today()], ["house", "==", "harmony hill"]];
    const internalBookings = await calUtils.getInternalBookings(internalBookingsFilter);
    if(internalBookings === false) return false;

    const bookingLists1 = Object.entries({
        "airbnb"      : airbnbBookings,
        "booking_com" : bookingComBookings,
        //"internal"    : internalBookings,
    });

    const bookingLists2 = Object.entries({
        "internal"    : internalBookings,
    });

    const result = {};
    for(const [name1, list1] of bookingLists1) {
        for(const [name2, list2] of bookingLists2) {
            if(name1 === name2) continue;
            const missingBookingsListName = `${name1}_bookings_missing_from_${name2}_list`;
            result[missingBookingsListName] = [];

            // Compare list1 to list2
            for(const booking1 of list1) {
                if(utils.isBeforeToday(booking1.checkInAt)) continue;
                const sameBooking2 = list2.find((booking2) => bookingIsSame(booking1, booking2));
                if(!sameBooking2) {
                    result[missingBookingsListName].push({
                        checkInAt: booking1.checkInAt, 
                        checkOutAt: booking1.checkOutAt
                    });
                }
            }
        }
    }
    
    return result;
}

export const getCalendar = async(iCalLink) => {
    try {
        const response = await fetch(iCalLink, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawICalData = await response.text();
        const result = calUtils.parseICal(rawICalData);        
        return result;
    } catch (error) {
        console.error("Request failed:", error);
        return false;
    }
};
