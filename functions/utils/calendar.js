import ICAL from 'ical.js';
import * as utils from "@harmonyhill/shared/utils.js";

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
    const {makeFirestoreAdapter} = await import("@harmonyhill/shared/firestoreAdapter.js");
    //const utils = await import("@harmonyhill/shared/utils.js");
    const {db, Timestamp} = await import("../admin-firebase.js");
    const adapter = await makeFirestoreAdapter(db, Timestamp);
    const bookings = await adapter.get("bookings", filters);
    return bookings;
}
