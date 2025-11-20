import { where, orderBy } from 'firebase/firestore';
import * as storageDao from "./storageDao.js";
import * as dao from "./dao.js";
import * as utils from "../utils.js";

export async function getOne(id, onError) {
    const path = [dao.constant.EXPENSES];
    return await dao.getOne(path, id, onError);
}

export async function get(filterOptions = {}, orderingOptions = {}, limit = -1, onError = null) {
    const path = [dao.constant.EXPENSES];
    let queryFilter = [];

    if (utils.exists(filterOptions, "activityId")) {
        queryFilter.push(where("activityId", "==", filterOptions.activityId));
    }

    if (utils.exists(filterOptions, "bookingId")) {
        queryFilter.push(where("activityId", "==", filterOptions.bookingId));
    }

    if (utils.exists(filterOptions, "category")) {
        const category = filterOptions.category.trim().toLowerCase();
        queryFilter.push(where("category", "==", category));
    }
    
    if (utils.exists(filterOptions, "paymentMethod")) {
        const paymentMethod = filterOptions.paymentMethod.trim().toLowerCase();
        queryFilter.push(where("paymentMethod", "==", paymentMethod));
    }

    if (utils.exists(filterOptions, "purchasedBy")) {
        const purchasedBy = filterOptions.purchasedBy.trim().toLowerCase();
        queryFilter.push(where("purchasedBy", "==", purchasedBy));
    }

    if (utils.exists(filterOptions, "after")) {
        const afterDateFireStore = utils.toFireStoreTime(filterOptions.after);
        queryFilter.push(where("purchasedAt", ">=", afterDateFireStore));
    }

    if (utils.exists(filterOptions, "before")) {
        const beforeDateFireStore = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("purchasedAt", "<=", beforeDateFireStore));
    }

    let ordering = [];
    for(const orderKey of Object.keys(orderingOptions)) {
        ordering.push(orderBy(orderKey, orderingOptions[orderKey]));
    }

    const expenses = await dao.get(path, queryFilter, ordering, limit, onError);
    return expenses;
}

export async function add(data, onError, writes) {
    const purchasedAt = utils.to_YYMMdd(data.purchasedAt);
    const purchasedBy = data.purchasedBy.replace(/ /g, "-");
    const category = data.category.replace(/ /g, "-");
    const id = `${data.index}-${category}-${purchasedBy}-${purchasedAt}-${Date.now()}`;
    const path = [dao.constant.EXPENSES];
    return await dao.add(path, id, data, onError, writes);
}

export async function update(id, data, onError, writes) {
    const path = [dao.constant.EXPENSES];
    return await dao.update(path, id, data, true, onError, writes);
}

export async function remove(id, onError, writes) {
    const path = [dao.constant.EXPENSES];
    const existing = await getOne(id, onError);
    if(existing && existing.fileName) {
        const removeFileResult = await storageDao.removeFile(existing.fileName, onError, writes);
        if(removeFileResult === false) {
            return false;
        }
    }
    const result = await dao.remove(path, id, onError, writes);
    return result;
}

export async function getNextSerialNumber(date, onError) {
    const filter = {
        "after"  : utils.monthStart(date),
        "before" : utils.monthEnd(date),
    };
    const elements = await get(filter, {"index":"desc"}, 1, onError);
    const last = elements && elements.length > 0 ? elements[0] : null;
    const nextIndex = last && last.index ? last.index + 1 : 1;
    return nextIndex;
}
