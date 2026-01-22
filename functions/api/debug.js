import { onRequest } from "firebase-functions/v2/https"; 
import * as dailyActivityJobs from "../triggers/createActivitiesJobs.js";
import * as hourlyNotificationJobs from "../triggers/hourlyNotificationsJobs.js";
//import { defineSecret } from "firebase-functions/params";

// Local-only HTTP trigger for debugging: http://localhost:5001/harmonyhill-1/us-central1/debug-hourlyJob
export const hourlyJob = onRequest(async (req, res) => {
    await hourlyNotificationJobs.runHourlyJob();
    res.send("Ran hourly job manually");
});

// Local-only HTTP trigger for debugging: http://localhost:5001/harmonyhill-1/us-central1/debug-dailyActivitiesJob
export const dailyActivitiesJob = onRequest(async (req, res) => {
    await dailyActivityJobs.dailyActivitiesCreationWork();
    res.send(`Ran daily activities job manually ${new Date().toISOString()}`);
});

