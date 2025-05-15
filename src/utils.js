import * as userService from "./services/userService.js";

export function jsonObjectDiffStr(obj1, obj2) {
    let diff = "";
  
    for (const key in obj2) {
        if(!Object.hasOwn(obj1, key)) {
            diff += ` ${key}: ${obj1[key]} added, `;
        }
        if (obj2[key] !== obj1[key]) {
            diff += ` ${key}: ${obj1[key]} -> ${obj2[key]}, `;
        }
    }

    // add prefix with user info & remove the last comma and space
    if (diff.length > 0) {
        const username = userService.getUserName();
        const nowStr = getDateStringWithTimeAndZone();
        diff = `Updated by ${username} at ${nowStr}: ${diff}`; 
        diff = diff.slice(0, -2);
    }
  
    return diff;
}

/**
 * @returns date string in the format YYMMDD HH:MM GMT+X
 */
export function getDateStringWithTimeAndZone(date = new Date()) {
    // Get parts
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    // Timezone offset in minutes
    const tzOffsetMin = date.getTimezoneOffset(); // e.g., -480 for GMT+8
    const tzOffsetHr = -tzOffsetMin / 60;         // Flip sign to match GMT+X
    
    const tz = `GMT${tzOffsetHr >= 0 ? "+" : ""}${tzOffsetHr}`;
    
    return `${year}${month}${day} ${hours}:${minutes} ${tz}`;
}

/**

 * @returns date string in the format YYMMDD
 */
export function getDateStringYYMMdd(date = new Date()) {
    // Get parts
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}
