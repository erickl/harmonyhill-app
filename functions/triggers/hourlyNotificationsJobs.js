import { onSchedule } from "firebase-functions/v2/scheduler";
import * as utils from "@harmonyhill/shared/utils.js";
import { makeAdapter } from "../db-adapter.js";

// Upload count of activities which still need more information (providers missing, etc)
export const hourlyJob = onSchedule("every 60 minutes", async (event) => {
    await hourlyWork();
});

const hourlyWork = async() => {
    const adapter = await makeAdapter();

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
