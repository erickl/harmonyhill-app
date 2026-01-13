import * as calUtils from "../utils/calendar.js";
import * as config from "../config/config.js";

export const getCalendar = async() => {
    try {
        const response = await fetch(config.AIRBNB_CALENDAR_HH, {
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

        return { success: true, data: result };

    } catch (error) {
        console.error("Request failed:", error);
        throw new functions.https.HttpsError("internal", "External API call failed");
    }
};