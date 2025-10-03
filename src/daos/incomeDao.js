import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

export async function transaction(inTransaction) {
    return dao.transaction(inTransaction);
}

export async function getOne(id, onError) {
    const path = [dao.constant.INCOME];
    return await dao.getOne(path, id, onError);
}

export async function get(filterOptions = {}, orderingOptions = {}, limit = -1, onError = null) {
    const path = [dao.constant.INCOME];
    let queryFilter = [];

    if (utils.exists(filterOptions, "category")) {
        const category = filterOptions.category.trim().toLowerCase();
        queryFilter.push(where("category", "==", category));
    }

    if (utils.exists(filterOptions, "bookingId")) {
        queryFilter.push(where("bookingId", "==", filterOptions.bookingId));
    }

    if (utils.exists(filterOptions, "activityId")) {
        queryFilter.push(where("activityId", "==", filterOptions.activityId));
    }

    if (utils.exists(filterOptions, "paymentMethod")) {
        const paymentMethod = filterOptions.paymentMethod.trim().toLowerCase();
        queryFilter.push(where("paymentMethod", "==", paymentMethod));
    }

    if (utils.exists(filterOptions, "after")) {
        const afterDateFireStore = utils.toFireStoreTime(filterOptions.after);
        queryFilter.push(where("receivedAt", ">=", afterDateFireStore));
    }

    if (utils.exists(filterOptions, "before")) {
        const beforeDateFireStore = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("receivedAt", "<=", beforeDateFireStore));
    }

    let ordering = [];
    for(const orderKey of Object.keys(orderingOptions)) {
        ordering.push(orderBy(orderKey, orderingOptions[orderKey]));
    }
    const incomes = await dao.get(path, queryFilter, ordering, limit, onError);
    return incomes;
}

export async function add(data, onError) {
    const receivedAt = utils.to_YYMMdd(data.receivedAt);
    const category = data.category.replace(/ /g, "-");
    const id = `${category}-${receivedAt}-${Date.now()}`;
    const path = [dao.constant.INCOME];
    data.index = await getNextSerialNumber(data.receivedAt, onError);
    return await dao.add(path, id, data, onError);
}

export async function update(id, data, onError) {
    const path = [dao.constant.INCOME];
    return await dao.update(path, id, data, true, onError);
}

export async function remove(id, onError) {
    const path = [dao.constant.INCOME];
    return await dao.remove(path, id, onError);
}

async function getNextSerialNumber(date, onError) {
    const filter = {
        "after"  : utils.monthStart(date),
        "before" : utils.monthEnd(date),
    };
    const elements = await get(filter, {"index":"desc"}, 1, onError);
    const last = elements && elements.length > 0 ? elements[0] : null;
    const nextIndex = last && last.index ? last.index + 1 : 1;
    return nextIndex;
}
