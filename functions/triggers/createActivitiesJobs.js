import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as activityUtils from "../utils/activity.js";
import * as bookingUtils from "../utils/booking.js";
import * as utils from "@harmonyhill/shared/utils.js";
import { makeAdapter } from "../db-adapter.js";

/**
 * '0 0 * * *' => runs at midnight, every day, every month, every day of the week
 */
export const dailyMaintenanceCheck = onSchedule('0 0 * * *', async (event) => {
    await dailyActivitiesCreationWork();
});

export const dailyActivitiesCreationWork = async() => {
    console.log("⏰ Scheduled daily activities check running at 00:00 AM UTC...");

    try {
        const currentBookings = await bookingUtils.getCurrentBookings();
        const futureBookings = await bookingUtils.getFutureBookings();
        const bookings = [...currentBookings, ...futureBookings];

        for(const booking of bookings) {
            if(utils.isTomorrow(booking.checkInAt)) {
                await createCheckInActivity(booking);
                await createCheckOutActivity(booking);
            }

            // If checkout tomorrow, no hk needed tomorrow
            else if(!utils.isTomorrow(booking.checkOutAt)) { 
                // If checkout is day after tomorrow, give red envelope tomorrow
                // Note: this won't create a red envelope event for guests staying only 1 night, since there's no "day-after-tomorrow" for them
                if(utils.isToday(booking.checkOutAt, 2)) {
                    const tomorrow = utils.today(1);
                    await createRedEnvelopeActivity(booking, tomorrow);
                    await createHousekeepingActivity(booking, tomorrow)
                }
            }   
        }
        console.log(`⏰ Activity creation for ${currentBookings.length} done`, new Date().toISOString());
    } catch(e) {
        console.log(`⏰ Scheduled daily activities check running at 00:00 AM UTC... Failed: ${e.message}`, new Date().toISOString());
    }
}

/**
 * Create checkin and checkout activities for bookings which are created with a checkin date of today.
 * Because these bookings won't get a checkin activity auto created by any scheduled trigger
 */
export const onBookingCreate = onDocumentCreated("bookings/{bookingId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const booking = snapshot.data();

    if(utils.isToday(booking.checkInAt)) {
        await createCheckInActivity(booking);
        await createCheckOutActivity(booking);
    }
});

async function createCheckInActivity(booking) {
    const adapter = await makeAdapter();
    const activitiesPath = activityUtils.createActivityCollectionPath(booking);
    const checkIn = activityUtils.createService(booking, "checkin");
    const checkInId = adapter.makeActivityId(checkIn);
    const checkInCreateResult = await adapter.add(activitiesPath, checkInId, checkIn);

    console.log(`⏰ Check in activity creation job for ${booking.id} ${checkInCreateResult !== false ? "done" : "failed"}`, new Date().toISOString());
    return checkInCreateResult;
}

async function createCheckOutActivity(booking) {
    const adapter = await makeAdapter();
    const activitiesPath = activityUtils.createActivityCollectionPath(booking);
    const checkOut = activityUtils.createService(booking, "checkout");
    const checkOutId = adapter.makeActivityId(checkOut);
    const checkOutCreateResult = await adapter.add(activitiesPath, checkOutId, checkOut);

    console.log(`⏰ Checkout activity creation job for ${booking.id} ${checkOutCreateResult ? "done" : "failed"}`, new Date().toISOString());
    return checkOutCreateResult;
}

async function createRedEnvelopeActivity(booking, startingAt) {
    const adapter = await makeAdapter();
    const activitiesPath = activityUtils.createActivityCollectionPath(booking);
    const redEnvelopeActivity = activityUtils.createService(booking, "red-envelope");
    redEnvelopeActivity.startingAt = startingAt;
    redEnvelopeActivity.startingTime  = startingAt.set({hour: 10});
    const activityId = adapter.makeActivityId(redEnvelopeActivity);
    const result = await adapter.add(activitiesPath, activityId, redEnvelopeActivity);
    
    console.log(`⏰ 🧧 Red envelope activity creation job for ${booking.id} ${result !== false ? "done" : "failed"}`, new Date().toISOString());       
    return result;
}

async function createHousekeepingActivity(booking, startingAt) {
    const adapter = await makeAdapter();
    const activitiesPath = activityUtils.createActivityCollectionPath(booking);
    const housekeepingActivity = activityUtils.createService(booking, "housekeeping");
    housekeepingActivity.startingAt = startingAt;
    housekeepingActivity.startingTime = null; // Time TBD
    const activityId = adapter.makeActivityId(housekeepingActivity);
    const result = await adapter.add(activitiesPath, activityId, housekeepingActivity);

    console.log(`⏰ 🧹 Housekeeping activity creation job for ${booking.id} ${result !== false ? "done" : "failed"}`, new Date().toISOString());
    return result;    
}
