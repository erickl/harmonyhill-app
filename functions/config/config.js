import cors from 'cors';

export const AIRBNB_CALENDAR_HH = "https://www.airbnb.com/calendar/ical/1370710838980597687.ics?t=e0ad020d4a5c4b6eaea2604abc8c0672";
export const AIRBNB_CALENDAR_HH_JN = "https://www.airbnb.com/calendar/ical/1547951330731417796.ics?t=29b5caaaa14b465ca37a2e2dc18c421c";
export const AIRBNB_CALENDAR_JN = "https://www.airbnb.com/calendar/ical/1303999373411502774.ics?t=6e1645e6f26b4586b1a640e1dc1af26c";

export const BOOKING_COM_CALENDAR_HH = "https://ical.booking.com/v1/export?t=6f7ccbcb-8178-4c69-8256-e27ea1b03e56";
export const BOOKING_COM_CALENDAR_JN = "https://ical.booking.com/v1/export?t=31ec5a0c-93f8-40ae-9ac3-f64517a55dee";

const allowedOrigins = [
    "https://harmonyhillbali.com",
    "https://www.harmonyhillbali.com",
    "https://harmonyhill-1.web.app"
];

export const corsHandler = cors({ origin: allowedOrigins });
//const corsHandler = cors({ origin: true }); // allows all