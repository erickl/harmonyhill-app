import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js"

export async function get(options = {}) {
    let filters = [];
    
    if(Object.hasOwn(options, "name")) {
        filters.push(where("name", "==", options.name));
    }

    if(Object.hasOwn(options, "activity")) {
        filters.push(where("activity", "==", options.activity));
    }

    const personnel = dao.get(["personnel"], filters);
    return personnel;
}

export async function add(personnelId, personnel) {
    return await dao.add([dao.constant.PERSONNEL], personnelId, personnel);
}

export async function update(personnelId, updatedPersonnel) {
    return await dao.update([dao.constant.PERSONNEL], personnelId, updatedPersonnel);
}

export async function testPersonnel() {
    
}
