import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * '0 0 * * *' => runs at midnight, every day, every month, every day of the week
 */
export const dailyMaintenanceCheck = onSchedule('0 0 * * *', async (event) => {
    await dailyActivitiesCreationWork();
});

export const dailyActivitiesCreationWork = async() => {
    console.log("⏰ Scheduled daily activities check running at 00:00 AM UTC...");

    try {
        const {makeFirestoreAdapter} = await import("@harmonyhill/shared/firestoreAdapter.js");
        const utils = await import("@harmonyhill/shared/utils.js");
        const {db, Timestamp} = await import("../admin-firebase.js");
        const adapter = await makeFirestoreAdapter(db, Timestamp);

        const today = utils.today();
        const tomorrow = utils.today(1);

        const currentBookings = await adapter.get("bookings", [
            ["checkInAt", "<=", today],
            ["checkOutAt", ">=", tomorrow],
        ]);

        const futureBookings = await adapter.get("bookings", [
            ["checkInAt", "==", tomorrow],
        ]);

        const bookings = [...currentBookings, ...futureBookings];

        const serviceActivity = {
            category      : "service",
            isFree        : true,
            needsProvider : false,
            status        : "guest confirmed",
            createdAt     : new Date(),
            createdBy     : "system",
        };

        for(const booking of bookings) {
            const activitiesPath = `bookings/${booking.id}/activities`;

            const bookingServiceActivity = {
                ...serviceActivity,
                house         : booking.house,
                bookingId     : booking.id,
                name          : booking.name,
            };

            if(utils.isTomorrow(booking.checkInAt)) {
                // Create check in activity
                const checkIn = {
                    subCategory   : "checkin",
                    startingAt    : booking.checkInAt,
                    startingTime  : booking.checkInTime,
                    ...bookingServiceActivity
                };

                if(utils.exists(booking, "comments")) checkIn.comments = booking.comments;
                if(utils.exists(booking, "customerInfo")) checkIn.customerInfo = booking.customerInfo;
                if(utils.exists(booking, "specialRequests")) checkIn.specialRequests = booking.specialRequests;
                if(utils.exists(booking, "promotions")) checkIn.promotions = booking.promotions;
                if(utils.exists(booking, "arrivalInfo")) checkIn.arrivalInfo = booking.arrivalInfo;
                
                const checkInId = adapter.makeActivityId(checkIn);
                const checkInCreateResult = await adapter.add(activitiesPath, checkInId, checkIn);
            
                console.log(`⏰ Check in activity creation job for ${booking.id} ${checkInCreateResult !== false ? "done" : "failed"}`, new Date().toISOString());

                // Create check out activity
                const checkOut = {
                    subCategory   : "checkout",
                    startingAt    : booking.checkOutAt,
                    startingTime  : booking.checkOutTime,
                    ...bookingServiceActivity
                };

                const checkOutId = adapter.makeActivityId(checkOut);
                const checkOutCreateResult = await adapter.add(activitiesPath, checkOutId, checkOut);

                console.log(`⏰ Checkout activity creation job for ${booking.id} ${checkOutCreateResult ? "done" : "failed"}`, new Date().toISOString());
            }

            // If checkout tomorrow, no hk needed tomorrow
            else if(!utils.isTomorrow(booking.checkOutAt)) { 
                // If checkout is day after tomorrow, give red envelope tomorrow
                // Note: this won't create a red envelope event for guests staying only 1 night, since there's no "day-after-tomorrow" for them
                if(utils.isToday(booking.checkOutAt, 2)) {
                    const redEnvelopeActivity = {
                        ...bookingServiceActivity,
                        house         : booking.house,
                        bookingId     : booking.id,
                        name          : booking.name,
                        subCategory   : "red-envelope",
                        startingAt    : tomorrow,
                        startingTime  : tomorrow.set({hour: 10}),
                    };

                    const activityId = adapter.makeActivityId(redEnvelopeActivity);
                    const result = await adapter.add(activitiesPath, activityId, redEnvelopeActivity);

                    console.log(`⏰ 🧧 Red envelope activity creation job for ${booking.id} ${result !== false ? "done" : "failed"}`, new Date().toISOString()); 
                }

                const housekeepingActivity = {
                    ...bookingServiceActivity,
                    startingAt   : tomorrow,
                    startingTime : null, // Time TBD
                    subCategory  : "housekeeping",
                };

                const activityId = adapter.makeActivityId(housekeepingActivity);
                const result = await adapter.add(activitiesPath, activityId, housekeepingActivity);

                console.log(`⏰ 🧹 Housekeeping activity creation job for ${booking.id} ${result !== false ? "done" : "failed"}`, new Date().toISOString());
            }   
        }
        console.log(`⏰ Activity creation for ${currentBookings.length} done`, new Date().toISOString());
    } catch(e) {
        console.log(`⏰ Scheduled daily activities check running at 00:00 AM UTC... Failed: ${e.message}`, new Date().toISOString());
    }
}
