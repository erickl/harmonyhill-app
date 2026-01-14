import ICAL from 'ical.js';
import * as utils from "@harmonyhill/shared/utils.js";
//const utils = await import("@harmonyhill/shared/utils.js");
import { makeAdapter } from "../db-adapter.js";

export function parseICal(rawICalData) {
    const jcalData = ICAL.parse(rawICalData);
    
    const components = new ICAL.Component(jcalData);
    const vEvents = components.getAllSubcomponents('vevent');

    const events = vEvents.map(event => {
        const item = new ICAL.Event(event);
        const checkInAt = utils.toDateTime(item.startDate.toJSDate());
        const checkOutAt = utils.toDateTime(item.endDate.toJSDate());
        return {
            summary: item.summary,
            checkInAt: checkInAt,
            checkOutAt: checkOutAt,
        };
    });

    return events;
}

/**
 * const filtersExample = [
 *      ["checkOutAt", ">=", today],
 *      ["house", "==", house],
 * ];
 * @param {*} filters 
 */
export async function getInternalBookings(filters) {
    const adapter = await makeAdapter();
    const bookings = await adapter.get("bookings", filters);
    return bookings;
}

export async function getCurrentBookings() {
    const today = utils.today();
    const tomorrow = utils.today(1);

    const currentBookings = await getInternalBookings([
        ["checkInAt", "<=", today],
        ["checkOutAt", ">=", tomorrow],
    ]);

    return currentBookings;
}

export async function getFutureBookings() {
    const tomorrow = utils.today(1);

    const futureBookings = await getInternalBookings([
        ["checkInAt", "==", tomorrow],
    ]);

    return futureBookings;
}
