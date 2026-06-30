import * as bookingService from "./bookingService.js";
import * as activityService from "./activityService.js";

export async function activitiesMigration(onError) {
    const updateData = {customerPrice: 0};
    const bookings = await bookingService.get({}, onError);
    const result = await Promise.all(bookings.map(async function(booking) {
        const activities = await activityService.get(booking.id, {subCategory: "breakfast"}, onError);
        // Consider turning off updateLogs in dao
        const result = await Promise.all(activities.map(async function(activity) {
            const result = await activityService.update(booking.id, activity.id, updateData, onError);
            if(result === false) {
                return false;
            }
            else return true;
        }));
    }));
    return result;
};
