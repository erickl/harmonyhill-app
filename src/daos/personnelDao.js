import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js"

export async function get(options = {}) {
    let filters = [];
    
    if(Object.hasOwn(options, "name")) {
        filters.push(where("name", "==", options.name));
    }

    if(Object.hasOwn(options, "activity")) {
        filters.push(where("activity", "==", options.activity.toLowerCase()));
    }

    if(Object.hasOwn(options, "location")) {
        filters.push(where("location", "==", options.location.toLowerCase()));
    }

    // todo: order by ??
    //      last used? 
    //
    //      cheapest?

    const personnel = dao.get([dao.constant.PERSONNEL], filters, [], -1);
    return personnel;
}

export async function getOne(personnelId) {
    return await dao.getOne([dao.constant.PERSONNEL], personnelId);
}

export async function add(personnelId, personnel) {
    return await dao.add([dao.constant.PERSONNEL], personnelId, personnel);
}

export async function update(personnelId, updatedPersonnel) {
    return await dao.update([dao.constant.PERSONNEL], personnelId, updatedPersonnel, true);
}
