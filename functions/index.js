/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 * // https://firebase.google.com/docs/functions/get-started
 */

// const logger = require("firebase-functions/logger");
//import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https"; 
// import { makeFirestoreAdapter } from "@harmonyhill/shared/firestoreAdapter.js";
//import * as utils from "@harmonyhill/shared/utils.js";
// import { db } from "./admin-firebase.js";
import cors from 'cors';

const allowedOrigins = [
    "https://harmonyhillbali.com",
    "https://www.harmonyhillbali.com",
    "https://harmonyhill-1.web.app"
];

const corsHandler = cors({ origin: allowedOrigins });
//const corsHandler = cors({ origin: true }); // allows all

// export const onNewBookingCreated = onDocumentCreated("bookings/{bookingId}", async (event) => {
//     const documentId = event.document; // holds doc path id
//     const doc = event.data;
//     const booking = doc.data();
//     const params = event.params; // holds bookingId and activityId
//     const bookingId = params.bookingId;

//     const {makeFirestoreAdapter} = await import("@harmonyhill/shared/firestoreAdapter.js");
//     const utils = await import("@harmonyhill/shared/utils.js");
//     const {db, Timestamp} = await import("./admin-firebase.js");
//     const adapter = await makeFirestoreAdapter(db, Timestamp);
//     if(!adapter) {
//         console.log(`Couldn't initialize firestore adapter for ${documentId}`);
//         return false;
//     } 

//     console.log(`👋 New booking. Auto created check in & checkout activities for booking ${bookingId}`);

//     return true;
// });

const hourlyWork = async() => {
    const {makeFirestoreAdapter} = await import("@harmonyhill/shared/firestoreAdapter.js");
    const utils = await import("@harmonyhill/shared/utils.js");
    const {db, Timestamp} = await import("./admin-firebase.js");
    const adapter = await makeFirestoreAdapter(db, Timestamp);

    const today = utils.today();

    const oneWeekFromNow = utils.today(7);
    
    const docs = await adapter.getCollectionGroup("activities", [
        ["startingAt",    ">=", today         ],
        ["startingAt",    "<=", oneWeekFromNow],
        ["needsProvider", "==", true          ],
        ["provider",      "==", ""            ]
    ],
        "startingAt"
    );
    const docIds = docs.map((doc) => doc.id);

    const notification = {
        name           : "Activity Providers Needed",
        collectionName : "activities",
        createdAt      : new Date(),
        count          : docs.length,
        ids            : docIds,
    };

    // Update the activity providers notification document
    const result = await adapter.add("notifications", "activity-providers-needed", notification);
    //await db.collection("notifications").doc("activity-providers-needed").set(notification);
    if(result !== false) {
        console.log("⏰ Hourly job done", new Date().toISOString());
    } else {
        console.log("Couldn't create activity-providers-needed notification", new Date().toISOString());
    }
}

// Upload count of activities which still need more information (providers missing, etc)
export const hourlyJob = onSchedule("every 60 minutes", async (event) => {
    await hourlyWork();
});

const dailyActivitiesCreationWork = async() => {
    console.log("⏰ Scheduled daily activities check running at 00:00 AM UTC...");

    try {
        const {makeFirestoreAdapter} = await import("@harmonyhill/shared/firestoreAdapter.js");
        const utils = await import("@harmonyhill/shared/utils.js");
        const {db, Timestamp} = await import("./admin-firebase.js");
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

/**
 * '0 0 * * *' => runs at midnight, every day, every month, every day of the week
 */
export const dailyMaintenanceCheck = onSchedule('0 0 * * *', async (event) => {
    await dailyActivitiesCreationWork();
});

// http://localhost:5001/harmonyhill-1/us-central1/getOccupancy?house=harmony-hill
// http://localhost:5001/harmonyhill-1/us-central1/getOccupancy?house=harmony-hill&year=2025&month=10
export const getOccupancy2 = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const {makeFirestoreAdapter} = await import("@harmonyhill/shared/firestoreAdapter.js");
        const utils = await import("@harmonyhill/shared/utils.js");
        const {db, Timestamp} = await import("./admin-firebase.js");

        const year = req.query.year;
        const month = req.query.month;
        const houseQuery = req.query.house.trim().toLowerCase();

        if(houseQuery !== "harmony-hill" && houseQuery !== "the-jungle-nook") {
            res.status(400).json({ 
                error: `Invalid option ${houseQuery}. Available houses are 'harmony-hill' & 'the-jungle-nook'` 
            });
            return;
        }

        try {
            const adapter = await makeFirestoreAdapter(db, Timestamp);

            const today = utils.today();
            const house = houseQuery.replace(/-/g, " ");

            let untilDate = null;
            if(!utils.isEmpty(year) && !utils.isEmpty(month)) {
                untilDate = utils.monthEnd(`${year}-${month}-01`);  
            }

            const filters = [
                ["checkOutAt", ">=", today],
                ["house", "==", house],
            ];

            if(!utils.isEmpty(untilDate)) {
                filters.push(["checkInAt", "<=", untilDate]);
            }

            const bookings = await adapter.get("bookings", filters);

            let occupied = {};
            for (const booking of bookings) {
                occupied = utils.getDatesBetween(booking.checkInAt, booking.checkOutAt, occupied);
            }

            res.status(200).json(occupied);
        } catch (error) {
            console.error("Error fetching availability:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
});

export const getOccupancy = onRequest( (req, res) => {
    // Manually handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send(""); // No content
        return;
    }

    // Add headers for actual requests too
    res.set("Access-Control-Allow-Origin", "*");

    const houseQuery = req.query.house?.trim().toLowerCase();
    if (houseQuery !== "harmony-hill" && houseQuery !== "the-jungle-nook") {
        res.status(400).json({
            error: `Invalid option ${houseQuery}. Available houses are 'harmony-hill' & 'the-jungle-nook'`,
        });
        return;
    }

    const year = req.query.year;
    const month = req.query.month;
    
    (async () => {
        try {
            const {makeFirestoreAdapter} = await import("@harmonyhill/shared/firestoreAdapter.js");
            const utils = await import("@harmonyhill/shared/utils.js");
            const {db, Timestamp} = await import("./admin-firebase.js");

            const adapter = await makeFirestoreAdapter(db, Timestamp);

            let untilDate = null;
            if (!utils.isEmpty(year) && !utils.isEmpty(month)) {
                untilDate = utils.monthEnd(`${year}-${month}-01`);
            }

            const today = utils.today();
            const house = houseQuery.replace(/-/g, " ");
            const filters = [
                ["checkOutAt", ">=", today],
                ["house", "==", house],
            ];
            if (!utils.isEmpty(untilDate)) {
                filters.push(["checkInAt", "<=", untilDate]);
            }

            const bookings = await adapter.get("bookings", filters);

            let occupied = {};
            for (const booking of bookings) {
                occupied = utils.getDatesBetween(booking.checkInAt, booking.checkOutAt, occupied);
            }

            res.status(200).json(occupied);
        } catch (error) {
            console.error("Error fetching availability:", error);
            res.status(500).json({ error: `Internal server error` });
        }
    })();
});

// Local-only HTTP trigger for debugging: http://localhost:5001/harmonyhill-1/us-central1/dailyActivitiesJobDebug
export const dailyActivitiesJobDebug = onRequest(async (req, res) => {
    await dailyActivitiesCreationWork();
    res.send(`Ran daily activities job manually ${new Date().toISOString()}`);
});

// Local-only HTTP trigger for debugging: http://localhost:5001/harmonyhill-1/us-central1/hourlyJob-0
export const hourlyJobDebug = onRequest(async (req, res) => {
    await runHourlyJob();
    res.send("Ran hourly job manually");
});
