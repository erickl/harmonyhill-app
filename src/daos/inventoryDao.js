import { where, orderBy } from 'firebase/firestore';
import * as utils from "../utils.js";
import * as dao from "../daos/dao.js";

export async function getOne(nameOrId, onError) {
    const id = nameOrId.startsWith("inv-") ? nameOrId : makeInventoryItemId(nameOrId);
    const path = ["inventory"];
    return await dao.getOne(path, id, onError);
}

export async function get(filterOptions, onError) {
    const path = ["inventory"];
    const queryFilter = [];

    if (utils.exists(filterOptions, "name")) {
        queryFilter.push(where("name", "==", filterOptions.name));
    }

    if (utils.exists(filterOptions, "type")) {
        queryFilter.push(where("type", "==", filterOptions.type));
    }

    if (utils.exists(filterOptions, "type")) {
        queryFilter.push(where("type", "==", filterOptions.type));
    }

    return await dao.get(path, queryFilter, [], -1, onError);
}

export async function removeStockChange(invItemId, stockChangeId, onError, writes) {
    const path = ["inventory", invItemId, "stock"];
    return await dao.remove(path, stockChangeId, onError, writes);
}

export async function add(object, onError, writes) {
    const inventoryItemId = makeInventoryItemId(object.name);
    const docId = makeId(object.type, inventoryItemId);
    const path = ["inventory", inventoryItemId, "stock"];
    return await dao.add(path, docId, object, onError, writes);
}

export async function updateStock(stockChangeId, invItemName, object, onError, writes) {
    const inventoryItemId = makeInventoryItemId(invItemName);
    const path = ["inventory", inventoryItemId, "stock"];
    return await dao.update(path, stockChangeId, object, true, onError, writes);
}

export async function getInventoryChange(name, type, activityId, onError) {
    const filter = {type: type, activityId: activityId};
    const inventoryChanges = await getInventoryChanges(name, filter, onError);
    if(!inventoryChanges || inventoryChanges.length === 0) {
        return null;
    }
    
    return inventoryChanges[0];
}

export async function getInventoryChanges(name, filterOptions, onError) {
    const invItem = await getOne(name, onError);
    if(!invItem) return [];

    const path = ["inventory", invItem.id, "stock"];

    const queryFilter = [];

    if (utils.exists(filterOptions, "after")) {
        const afterDateFireStore = utils.toFireStoreTime(filterOptions.after);
        queryFilter.push(where("createdAt", ">=", afterDateFireStore));
    }

    if (utils.exists(filterOptions, "before")) {
        const beforeDateFireStore = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("createdAt", "<=", beforeDateFireStore));
    }

    if (utils.exists(filterOptions, "type")) {
        queryFilter.push(where("type", "==", filterOptions.type));
    }

    if (utils.exists(filterOptions, "bookingId")) {
        queryFilter.push(where("bookingId", "==", filterOptions.bookingId));
    }

    if (utils.exists(filterOptions, "activityId")) {
        queryFilter.push(where("activityId", "==", filterOptions.activityId));
    }

    if (utils.exists(filterOptions, "house")) {
        queryFilter.push(where("house", "==", filterOptions.house));
    }

    if (utils.exists(filterOptions, "quantity")) {
        queryFilter.push(where("quantity", "==", filterOptions.quantity));
    }

    let ordering = [ orderBy("createdAt", "asc") ];
    return await dao.get(path, queryFilter, ordering, -1, onError);
}

export async function getLastClosedRecord(name, onError) {
    const invItem = await getOne(name, onError);
    if(!invItem) return null;

    const path = ["inventory", invItem.id, `${invItem.id}-closed`];
    const newestFirst = [ orderBy("closedAt", "desc") ];
    
    const lastClosedRecords = await dao.get(path, [], newestFirst, 1, onError);
    if(!lastClosedRecords || lastClosedRecords.length < 1) return null;

    const lastClosedRecord = lastClosedRecords[0];
    return lastClosedRecord;
}

export async function addClosedRecord(name, data, onError, writes) {
    const invItemId = makeInventoryItemId(name);

    const previousMonthShort = data.closedAt.monthShort.toLowerCase();
    const yearYY = data.closedAt.year - 2000;
    const id = `${invItemId}-closed-${previousMonthShort}-${yearYY}`;
    const path = ["inventory", invItemId, "inv-closed"];
    
    return await dao.add(path, id, data, onError, writes);
}

export function makeId(type, inventoryItemId) {
    const date = utils.to_YYMMdd();
    return `${inventoryItemId}-${type}-${date}-${Date.now()}`;
}

export function makeInventoryItemId(name) {
    const nameCleaned = name.trim().toLowerCase().replace(/ /g, "-");
    return `inv-${nameCleaned}`;
}
