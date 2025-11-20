import * as dao from "./dao.js";
import * as utils from "../utils.js";
import { where, orderBy } from 'firebase/firestore';

export async function get(filterOptions, onError) {
    const path = dao.constant.USER_LOGS;
    let queryFilter = [];

    if (utils.exists(filterOptions, "action")) {
        queryFilter.push(where("action", "==", filterOptions.action));
    }

    if (utils.exists(filterOptions, "createdBy")) {
        queryFilter.push(where("createdBy", "==", filterOptions.createdBy));
    }

    if (utils.exists(filterOptions, "after")) {
        const afterDateFireStore = utils.toFireStoreTime(filterOptions.after);
        queryFilter.push(where("createdAt", ">=", afterDateFireStore));
    }

    if (utils.exists(filterOptions, "before")) {
        const beforeDateFireStore = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("createdAt", "<=", beforeDateFireStore));
    }

    let logs = await dao.get([path], queryFilter, [], -1, onError);

    if(utils.exists(filterOptions, 'collection')) {
        logs = logs.filter(item => item.document.includes(filterOptions.collection));
    }

    const sortedLogs = dao.sort(logs, "createdAt", "desc");
    return sortedLogs;
}

export async function getDocument(path, id,  onError) {
    return await dao.getOne(path, id, onError);
}

export async function remove(id, onError, writes) {
    const path = [dao.constant.USER_LOGS];
    return await dao.remove([path], id, onError, writes);
}
