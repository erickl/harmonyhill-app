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

    // add prefix & remove the last comma and space
    if (diff.length > 0) {
        const username = userService.getUserName();
        diff = `Updated by ${username} at ${new Date()}: ${diff}`; 
        diff = diff.slice(0, -2);
    }
  
    return diff;
}
