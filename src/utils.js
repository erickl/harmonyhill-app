import { Timestamp } from "firebase/firestore";
import * as userService from "./services/userService.js";
import { DateTime } from 'luxon';

export async function jsonObjectDiffStr(obj1, obj2) {
    let diff = "";

    for (const key in obj2) {
        if (!Object.hasOwn(obj1, key)) {
            diff += ` ${key}: ${obj1[key]} added, `;
        }
        if (obj2[key] !== obj1[key]) {
            diff += ` ${key}: ${obj1[key]} -> ${obj2[key]}, `;
        }
    }

    // add prefix with user info & remove the last comma and space
    if (diff.length > 0) {
        const username = await userService.getUserName();
        const nowStr = to_yyMMddHHmmTz();
        diff = `Updated by ${username} at ${nowStr}: ${diff}`;
        diff = diff.slice(0, -2);
    }

    return diff;
}

export function isAmount(value) {
    return isNumber(value);
}

export function isNumber(value) {
    return typeof value === "number" && !isNaN(value);
}

export function isString(value) {
    return typeof value === "string";
}

export function isDate(value) {
    return DateTime.isDateTime(value);
}

/**
 * @returns date string in the format YYMMDD HH:MM GMT+X
 */
export function to_yyMMddHHmmTz(date = new Date()) {
    const jsDate = toJsDate(date);
    const data = getData(jsDate);
    return `${data.yy}${data.month}${data.day} ${data.hours}:${data.minutes} ${data.tz}`;
}

/**
 * @returns date string formatted as YYMMDD, without hyphens
 */
export function to_YYMMdd(inputDate) {
    const jsDate = toJsDate(inputDate);
    const data = getData(jsDate);
    return `${data.yy}${data.month}${data.day}`;
}

function getData(inputDate) {
    const jsDate = toJsDate(inputDate); 
    const month = (jsDate.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed, so add 1

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Timezone offset in minutes
    const tzOffsetMin = jsDate.getTimezoneOffset(); // e.g., -480 for GMT+8
    const tzOffsetHr = -tzOffsetMin / 60;         // Flip sign to match GMT+X
    const tz = `GMT${tzOffsetHr >= 0 ? "+" : ""}${tzOffsetHr}`;

    return {
        yy: jsDate.getFullYear().toString().slice(-2),
        ccyy: jsDate.getFullYear(), // Full year
        month: month,
        day: jsDate.getDate().toString().padStart(2, '0'), // Pad day with leading zero if needed
        hours: jsDate.getHours().toString().padStart(2, '0'), // Pad hour with leading zero if needed
        minutes: jsDate.getMinutes().toString().padStart(2, '0'), // Pad minute with leading zero if needed
        tz: tz,
        monthName: monthNames[jsDate.getMonth()],
    };
}

function toJsDate(inputDate) {
    // Convert Luxon DateTime to JavaScript Date
    if (inputDate instanceof DateTime) {
        return inputDate.toJSDate(); 
    }
    // Convert Firestore Timestamp to JavaScript Date 
    else if (inputDate instanceof Timestamp) {
        return inputDate.toDate();
    } else if (inputDate instanceof Date) {
        return inputDate;
    } else if (typeof inputDate === "string") {
        const parsedDate = new Date(inputDate);
        if (isNaN(parsedDate)) {
            throw new Error("Invalid date string format.");
        }
        return parsedDate;
    } else {
        throw new Error("Invalid date type. Expected DateTime, Timestamp, Date, or string.");
    }
}

export function to_ddMMM(inputDate) {
    let jsDate = toJsDate(inputDate);
    const data = getData(jsDate);
    return `${data.day} ${data.monthName}`;
}

export function dateStringToDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript Date
    return date;
}

export function toFireStoreTime(inputDate) {
    const jsDate = toJsDate(inputDate);
    return Timestamp.fromDate(jsDate);
}

export function fromFireStoreTime(timestamp) {
    const jsDate = toJsDate(timestamp);
    const luxonDateTime = DateTime.fromJSDate(jsDate, { zone: getHotelTimezone() });
    return luxonDateTime;
}

export function getHotelTimezone() {
    return 'Asia/Singapore';
}
