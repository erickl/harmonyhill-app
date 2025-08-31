import { Timestamp } from "firebase/firestore";
import * as userService from "./services/userService.js";
import { DateTime } from 'luxon';

export async function jsonObjectDiffStr(obj1, obj2) {
    let diff = "";
    
    try {
        if(isEmpty(obj1)) {
            throw new Error("Original object was null");
        }
        if(isEmpty(obj2)) {
            throw new Error("New object was null");
        }

        for (const key in obj2) {
            try {
                if(key === "updatedBy") continue;
                if(key === "updatedAt") continue;
                if(key === "createdBy") continue;
                if(key === "createdAt") continue;

                const val1 = obj1[key];
                const val2 = obj2[key];

                if(isEmpty(val1) && isEmpty(val2)) {
                    continue;
                }
                else if (isEmpty(val1)) {
                    // Display human readable data
                    const val2Legible = isDate(val2) ? toDateTime(val2) : val2; 
                    diff += `Added ${key}: ${val2Legible}, `;
                } 
                else if(isDate(val2)) {
                    const val1DateTime = toDateTime(val1);
                    const val2DateTime = toDateTime(val2);
                    if(!val1DateTime.equals(val2DateTime)) {
                        diff += ` ${key}: ${val1DateTime} -> ${val2DateTime}, `;
                    }
                }
                else if (val2 !== val1) {
                    const val2_ = isEmpty(val2) ? "[empty]" : val2;
                    diff += ` ${key}: ${val1} -> ${val2_}, `;
                }
            } catch(e) {
                diff += `Failed comparing field ${key}: ${e.message}, `;
            }
        }

        // add prefix with user info & remove the last comma and space
        if (diff.length > 0) {
            const username = await userService.getCurrentUserName();
            const nowStr = to_yyMMddHHmmTz(DateTime.now());
            diff = `Updated by ${username} at ${nowStr}: ${diff}`;
            diff = diff.slice(0, -2);
        }
    } catch(e) {
        diff += `Unexpected error in update comparison: ${e.message}`;
    }

    return diff;
}

export function toNumber(valueIn) {
    if(isString(valueIn)) {
        const value = valueIn.replace(/,/g, '');
        return Number(value);
    } else if(isNumber(valueIn)) {
        return valueIn;
    } else {
        throw new Error(`${valueIn} cannot be parsed to a number`);
    }
}

export function isBoolean(value) {
    return typeof value === "boolean";
}

export function isAmount(value) {
    return isNumber(value) || isString(value);
}

export function isNumber(value) {
    return typeof value === "number" && !isNaN(value);
}

export function isEmpty(value) {
    value = isString(value) ? value.trim() : value;
    if(value == "" || value == undefined || value == null) {
        return true;
    }

    const valueStr = JSON.stringify(value);
    return valueStr === "[]" || valueStr === "{}";
}

export function isString(value) {
    return  typeof value === "string";
}

export function getCurrency() {
    return "Rp";
}

export function isDateTime(value) {
    return DateTime.isDateTime(value);
}

export function isDate(value) {
    if(value instanceof Date || value instanceof Timestamp || isDateTime(value)) {
        return true;
    } else if(isString(value)) {
        const hasDateFormat = /^\d{4}-\d{2}-\d{2}/.test(value); // starts with YYYY-MM-dd
        if(hasDateFormat) {
            const parsedDate = new Date(value);
            return !isNaN(parsedDate);
        }
    }
    return false;
}

/**
 * @returns date string in the format YYMMDD HH:MM GMT+X
 */
export function to_yyMMddHHmmTz(date = null) {
    date = date ? date : now();
    const data = getData(date);
    return `${data.yy}${data.month}${data.day} ${data.hours}:${data.minutes} ${data.tz}`;
}

/**
 * @returns date string formatted as YYMMDD, without hyphens
 */
export function to_YYMMdd(date = null) {
    date = date ? date : now();
    const data = getData(date);
    return `${data.yy}${data.month}${data.day}`;
}

function getData(inputDate) {
    if(isEmpty(inputDate)) {
        return {};
    }
    
    const luxonDateTime = toLuxonDateTime(inputDate); 
    const month = luxonDateTime.month.toString().padStart(2, '0');

    const monthNames = [
        "0", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Timezone offset in minutes
    const tzOffsetMin = luxonDateTime.offset; // e.g., -480 for GMT+8
    const tzOffsetHr = tzOffsetMin / 60;         // Flip sign to match GMT+X
    const tz = `GMT${tzOffsetHr >= 0 ? "+" : ""}${tzOffsetHr}`;

    return {
        yy        : luxonDateTime.year.toString().slice(-2),
        ccyy      : luxonDateTime.year, // Full year
        month     : month,
        day       : luxonDateTime.day.toString().padStart(2, '0'), // Pad day with leading zero if needed
        weekday   : luxonDateTime.weekdayShort,
        hours     : luxonDateTime.hour.toString().padStart(2, '0'), // Pad hour with leading zero if needed
        minutes   : luxonDateTime.minute.toString().padStart(2, '0'), // Pad minute with leading zero if needed
        tz        : tz,
        monthName : monthNames[luxonDateTime.month],
    };
}

function toLuxonDateTime(inputDate) {
    if (inputDate instanceof DateTime) {
        return inputDate;
    } else if (inputDate instanceof Timestamp) {
        const date = inputDate.toDate();
        return DateTime.fromJSDate(date, { zone: getHotelTimezone() });
    } else if (inputDate instanceof Date) {
        return DateTime.fromJSDate(inputDate, { zone: getHotelTimezone() });
    } else if (typeof inputDate === "string") {
        const formats = generateDateFormats();
        for(const format of formats) {
            const luxonDateTime = DateTime.fromFormat(inputDate, format, { zone: getHotelTimezone() });
            if(luxonDateTime.isValid) {
                return luxonDateTime;
            }
        }

        throw new Error(`Invalid date string format: ${inputDate}`);      
    } else {
        throw new Error(`Invalid date type. Expected DateTime, Timestamp, Date, or string: ${inputDate}`);
    }
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
        const luxonDateTime = DateTime.fromJSDate(inputDate, { zone: getHotelTimezone() });
        return luxonDateTime.toJSDate();
    } else if (typeof inputDate === "string") {
        let parsedDate = null;
        
        const formats = generateDateFormats();
        for(const format of formats) {
            const luxonDateTime = DateTime.fromFormat(inputDate, format, { zone: getHotelTimezone() });
            if(luxonDateTime.isValid) {
                parsedDate = luxonDateTime.toJSDate();
                break;
            }
        }

        if (!parsedDate) {
            throw new Error(`Invalid date string format: ${inputDate}`); 
        }
        
        return parsedDate;
    } else {
        throw new Error(`Invalid date type. Expected DateTime, Timestamp, Date, or string: ${inputDate}`);
    }
}

export function to_ddMMM(date = null) {
    date = date ? date : now();
    const data = getData(date);
    return `${data.day} ${data.monthName}`;
}

export function to_www_ddMMM(date = null) {
    date = date ? date : now();
    const data = getData(date);
    return `${data.weekday}, ${data.day} ${data.monthName}`;
}

export function to_HHmm(date = null) {
    date = date ? date : now();
    const data = getData(date);
    return `${data.hours}:${data.minutes}`;
}

export function to_ddMMM_HHmm(date = null) {
    date = date ? date : now();
    const data = getData(date);
    return `${data.day} ${data.monthName} ${data.hours}:${data.minutes}`;
}

export function toFireStoreTime(inputDate) {
    if(isEmpty(inputDate)) return null;
    const luxonDateTime = toLuxonDateTime(inputDate);
    const jsDate = toJsDate(luxonDateTime);
    return Timestamp.fromDate(jsDate);
}

export function toDateTime(inputDate) {
    if(isEmpty(inputDate)) return null;
    return toLuxonDateTime(inputDate);
}

export function isToday(inputDate) {
    const luxonDateTime = toLuxonDateTime(inputDate);
    const todayDateTime = today();
    return luxonDateTime.day == todayDateTime.day;
}

/**
 * get a Luxon date time object with time at midnight
 */
export function monthStart(addDays = 0) {
    return now(addDays).startOf('month');
}

/**
 * get a Luxon date time object with time at midnight
 */
export function monthEnd(addDays = 0) {
    return now(addDays).endOf('month');
}

/**
 * get a Luxon date time object with time at midnight
 */
export function today(addDays = 0) {
    return now(addDays).startOf('day');
}

/**
 * get a Luxon date time object with time at this moment
 */
export function now(addDays = 0) {
    return DateTime.now().setZone(getHotelTimezone(), { keepLocalTime: true }).plus({days: addDays});
}

export function getHotelTimezone() {
    return 'Asia/Singapore';
}

export function getHouseColor(house) {
    house  = house ? house.toLowerCase() : "";
    switch (house) {
        case 'the jungle nook':
            return 'bg-jn'; // Tailwind CSS class for light blue
        case 'harmony hill':
            return 'bg-hh'; // Tailwind CSS class for light green
        default:
            return 'bg-none'; // No background color by default
    }
};

export function cleanNumeric(value) {
    // Remove all non-digit characters (commas, dots, currency symbols, etc.)
    const cleanValue = isString(value) ? value.replace(/[^0-9]/g, '') : value;
    // Convert to integer; use empty string if input is empty
    const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
    return numericValue;
}

export function capitalizeWords(str) {
    return isString(str) ? str.replace(/\b\w/g, (char) => char.toUpperCase()) : str;
}

export function formatDisplayPrice(price, useCurrencyPrefix = false) {
    const amount = isAmount(price) ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0';
    return `${(useCurrencyPrefix ? getCurrency() + " " : "")}${amount}`;
}

function generateDateFormats() {
    let formats = [];
    for(const d of ["d", "dd"]) {
        for(const M of ["M", "MM"]) {
            for(const y of ["yy", "yyyy"]) {
                for(const sep of ["-", "/"]) {
                    formats.push(`${d}${sep}${M}${sep}${y}`);
                } 
            }
        }
    }
    formats.push("yyyy/MM/dd", "yyyy-MM-dd");

    return formats;
}

export function groupBy(elements, createKey) {
    return Object.values(elements).reduce((map, element) => {
        const group = createKey(element);
        if(!map[group]) map[group] = [];
        map[group].push(element);
        return map;
    }, {});
}