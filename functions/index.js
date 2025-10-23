/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const logger = require("firebase-functions/logger");
// const { onDocumentCreated } = require("firebase-functions/v2/firestore");
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https"; 
import { makeFirestoreAdapter } from "@harmonyhill/shared/firestoreAdapter.js";
import * as utils from "@harmonyhill/shared/utils.js";
import { db } from "./admin-firebase.js";

// https://firebase.google.com/docs/functions/get-started

// exports.onAnyActivityCreated = onDocumentCreated("bookings/{bookingId}/activities/{activityId}", (event) => {
//     const doc = event.data;
//     const data = doc.data();
//     const params = event.params; // holds bookingId and activityId
//     const documentId = event.document; // holds doc path id

//     const bookingId = params.bookingId;
//     const activityId = params.activityId;

//     //console.log(`👋 Hello! New activity ${activityId} created under booking ${bookingId}:`, data);
//     console.log(`👋 Hello! New activity`);

//     return null;
// });

export const hourlyWork = async() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);
    oneWeekFromNow.setHours(0, 0, 0, 0);
    
    const adapter = await makeFirestoreAdapter(db);
    const docs = await adapter.getCollectionGroup("activities", [
        ["startingAt", ">=", today],
        ["startingAt", "<=", oneWeekFromNow],
        ["needsProvider", "==", true],
        ["provider", "==", ""]
    ],
        "startingAt"
    );
    const docIds = docs.map((doc) => doc.id);

    // Update the activity providers notification document
    await db.collection("notifications").doc("activity-providers-neededP") .set({
        name           : "Activity Providers Needed",
        collectionName : "activities",
        createdAt      : new Date().toISOString(),
        count          : docs.length,
        ids            : docIds,
    });

    console.log("⏰ Hourly job done", new Date().toISOString());
}

// Upload count of activities which still need more information (providers missing, etc)
export const hourlyJob = onSchedule("every 60 minutes", async (event) => {
    await hourlyWork();
});

// Local-only HTTP trigger for debugging: http://localhost:5001/harmonyhill-1/us-central1/hourlyJob-0
export const hourlyJobDebug = onRequest(async (req, res) => {
    await runHourlyJob();
    res.send("Ran hourly job manually");
});

// http://localhost:5001/harmonyhill-1/us-central1/getOccupancy?house=harmony-hill
// http://localhost:5001/harmonyhill-1/us-central1/getOccupancy?house=harmony-hill&year=2025&month=10
export const getOccupancy = onRequest(async (req, res) => {
    const allowedOrigins = [
        "https://harmonyhillbali.com",
        "https://www.harmonyhillbali.com",
        "https://harmonyhill-1.web.app"
    ];

    const origin = req.headers.origin;

    // Allow all only in development
    if (process.env.FUNCTIONS_EMULATOR === "true") {
        res.set("Access-Control-Allow-Origin", "*");
    } else if (allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    } else {
        // optionally log or deny silently
        res.set("Access-Control-Allow-Origin", "null");
    }

    //res.set("Access-Control-Allow-Origin", "*"); // Allow all origins (public API)
    res.set("Access-Control-Allow-Methods", "GET");

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    const houseQuery = req.query.house.trim().toLowerCase();
    if(houseQuery !== "harmony-hill" && houseQuery !== "the-jungle-nook") {
        res.status(400).json({ 
            error: `Invalid option ${houseQuery}. Available houses are 'harmony-hill' & 'the-jungle-nook'` 
        });
        return;
    }

    const year = req.query.year;
    const month = req.query.month;
    let untilDate = null;
    if(!utils.isEmpty(year) && !utils.isEmpty(month)) {
        untilDate = utils.monthEnd(`${year}-${month}-01`);  
    }

    try {
        const adapter = await makeFirestoreAdapter(db);

        const today = utils.today();
        const house = houseQuery.replace(/-/g, " ");

        const filters = [
            ["checkOutAt", ">=", today],
            ["house", "==", house],
        ];

        if(!utils.isEmpty(untilDate)) {
            filters.push(["checkInAt", "<=", untilDate]);
        }

        const bookings = await adapter.get("bookings", filters);

        let occupied = {};
        for(const booking of bookings) {
            occupied = utils.getDatesBetween(today, booking.checkOutAt, occupied);
        }

        res.status(200).json(occupied);
    } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
