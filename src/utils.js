import { Timestamp } from "firebase/firestore";
import * as userService from "./services/userService.js";
import { DateTime } from 'luxon';

export async function jsonObjectDiffStr(obj1, obj2) {
    let diff = "";

    for (const key in obj2) {
        const val1 = obj1[key];
        const val2 = obj2[key];

        if(isEmpty(val2)) continue;
        
        else if (!Object.hasOwn(obj1, key)) {
            diff += ` ${key}: ${val1} added, `;
        } 
        else if(isDate(val2)) {
            const val1DateTime = toDateTime(val1);
            const val2DateTime = toDateTime(val2);
            if(!val1DateTime.equals(val2DateTime)) {
                diff += ` ${key}: ${val1} -> ${val2}, `;
            }
        }
        else if (val2 !== val1) {
            diff += ` ${key}: ${val1} -> ${val2}, `;
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
    return isNumber(value) || isString(value);
}

export function isNumber(value) {
    return typeof value === "number" && !isNaN(value);
}

export function isEmpty(value) {
    value = isString(value) ? value.trim() : value;
    return isNaN(value) || value == "" || value == undefined || value == null;
}

export function isString(value) {
    return  typeof value === "string";
}

export function isDate(value) {
    if(value instanceof Date || value instanceof Timestamp || DateTime.isDateTime(value)) {
        return true;
    } else if(isString(value)) {
        const parsedDate = new Date(value);
        return !isNaN(parsedDate);
    }
    else return false;
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
        throw new Error(`Invalid date type. Expected DateTime, Timestamp, Date, or string: ${inputDate}`);
    }
}

export function to_ddMMM(inputDate) {
    let jsDate = toJsDate(inputDate);
    const data = getData(jsDate);
    return `${data.day} ${data.monthName}`;
}

export function to_HHmm(inputDate) {
    let jsDate = toJsDate(inputDate);
    const data = getData(jsDate);
    return `${data.hours}:${data.minutes}`;
}

export function to_ddMMM_HHmm(inputDate) {
    let jsDate = toJsDate(inputDate);
    const data = getData(jsDate);
    return `${data.day} ${data.monthName} ${data.hours}:${data.minutes}`;
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

export function toDateTime(timestamp) {
    const jsDate = toJsDate(timestamp);
    const luxonDateTime = DateTime.fromJSDate(jsDate, { zone: getHotelTimezone() });
    return luxonDateTime;
}

/**
 * get a Luxon date time object with time at midnight
 */
export function today() {
    return DateTime.now().setZone(getHotelTimezone()).startOf('day');
}

export function getHotelTimezone() {
    return 'Asia/Singapore';
}

export function getHouseColor(house) {
    house  = house.toLowerCase();
    switch (house) {
        case 'the jungle nook':
            return 'bg-jn'; // Tailwind CSS class for light blue
        case 'harmony hill':
            return 'bg-hh'; // Tailwind CSS class for light green
        default:
            return 'bg-none'; // No background color by default
    }
};
