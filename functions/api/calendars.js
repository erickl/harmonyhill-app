import { onRequest } from "firebase-functions/v2/https"; 
import * as calChecks from "../triggers/calendarChecks.js";
import * as calUtils from "../utils/booking.js";
import * as config from "../config/config.js";
import * as utils from "@harmonyhill/shared/utils.js";
//const utils = await import("@harmonyhill/shared/utils.js");
import { makeAdapter } from "../db-adapter.js";

// http://localhost:5001/harmonyhill-1/us-central1/calendars-check
export const check = onRequest(async (req, res) => {
    (async () => {
        const result = await calChecks.compareCalendars();
        res.status(200).json(result);
    })();
});

// http://localhost:5001/harmonyhill-1/us-central1/calendars-getOccupancy
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

            const bookings = await calUtils.getInternalBookings(filters);

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

// http://localhost:5001/harmonyhill-1/us-central1/getOccupancy?house=harmony-hill
// http://localhost:5001/harmonyhill-1/us-central1/getOccupancy?house=harmony-hill&year=2025&month=10
export const getOccupancy2 = onRequest((req, res) => {
    config.corsHandler(req, res, async () => {
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
            const adapter = await makeAdapter();

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
