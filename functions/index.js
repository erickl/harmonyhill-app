/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Initialize admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}

// Only when running Firestore emulator
if (process.env.FUNCTIONS_EMULATOR === 'true') {
    admin.firestore().settings({
        host: "localhost:8080",
        ssl: false,
    });
}

// Only when running RTDB emulator locally
if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    const db = admin.database();
    db.useEmulator("localhost", 9000); // 9000 is the default port
}

// To get more time for step debugging during development
if (process.env.FUNCTIONS_EMULATOR === 'true') {
    setGlobalOptions({ timeoutSeconds: 300 });
} else {
    setGlobalOptions({ timeoutSeconds: 60 }); 
}

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

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

// Test run in shell: hourlyJob()
exports.hourlyJob = onSchedule("every 60 minutes", async (event) => {
    const db = admin.firestore();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);
    oneWeekFromNow.setHours(0, 0, 0, 0);

    const snapshot = await db.collectionGroup("activities")
        .where("startingAt", ">=", today)
        .where("startingAt", "<=", oneWeekFromNow)
        .where("needsProvider", "==", true)
        .where("provider", "==", "")
        .orderBy("startingAt")
        //.limit(10)
        .get();

    const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
    const docIds = docs.map((doc) => doc.id);
 
    // Update the activity providers notification document
    await db.collection("notifications").doc("activity-providers-neededP") .set({
        name           : "Activity Providers Needed",
        collectionName : "activities",
        createdAt      : new Date().toISOString(),
        count          : docs.length,
        ids            : docIds
    });

    console.log("⏰ Hourly job done", new Date().toISOString());
});
