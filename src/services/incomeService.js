import * as utils from "../utils.js";
import * as incomeDao from "../daos/incomeDao.js";
import {getOne as getBooking} from "./bookingService.js";
import {getOne as getActivity} from "./activityService.js";
import {commitTx} from "../daos/dao.js";

export async function get(filterOptions, onError) {
    const incomes = await incomeDao.get(filterOptions, {"receivedAt":"desc"}, -1, onError);
    const formattedIncomes = incomes.map((income) => {
        income.receivedAt = utils.toDateTime(income.receivedAt);
        return income;
    });
    return formattedIncomes;
}

export async function add(data, onError, writes = []) {
    const commit = writes.length === 0;

    const object = await mapIncomeObject(data);
    const result = await incomeDao.add(object, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
}

export async function remove(id, onError, writes = []) {  
    const commit = writes.length === 0; 

    const existing = await incomeDao.getOne(id, onError);
    if(!existing) {
        return onError(`Could not find income record ${id}`);
    }

    const result = await incomeDao.remove(id, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
}

export async function update(id, data, onError, writes = []) {
    const commit = writes.length === 0;

    const object = await mapIncomeObject(data);

    const existing = await incomeDao.getOne(id);
    if(!existing) {
        return onError(`Could not find existing income ${id}`);
    }
    
    const result = await incomeDao.update(id, object, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
}

async function mapIncomeObject(data) {
    let object = {};

    if(utils.isAmount(data.amount)) object.amount = data.amount;

    if(!utils.isEmpty(data.category)) {
        object.category = data.category.trim().toLowerCase();
        if(object.category === "guest payment" ) {
            object.bookingId = utils.exists(data, "bookingId") ? data.bookingId: null;
        } else if(object.category === "commission") {
            object.bookingId = utils.exists(data, "bookingId") ? data.bookingId: null;
            object.activityId = utils.exists(data, "activityId") ? data.activityId: null;
        }
        object.description = `${object.category}`;
    }

    if(!utils.isEmpty(data.paymentMethod)) object.paymentMethod = data.paymentMethod.trim().toLowerCase();

    if(utils.isDateTime(data.receivedAt)) object.receivedAt = utils.toFireStoreTime(data.receivedAt);

    if(!utils.isEmpty(data.comments)) object.comments = data.comments.trim();

    const booking = object.bookingId ? await getBooking(object.bookingId) : null;
    if(booking && booking.name) {
        object.description += `, ${booking.name}`;
    }

    const activity = object.bookingId && object.activityId ? await getActivity(object.bookingId, object.activityId) : null;
    if(activity && activity.displayName) {
        object.description += `, ${activity.displayName}`;
    }

    return object;
}

export async function validate(data, onError) {
    try {
        if (!utils.isAmount(data.amount) || data.amount <= 0) {
            onError(`Input an amount above zero`);
            return false;
        } 
        if(utils.isEmpty(data.category)) {
            onError(`Choose category`);
            return false;
        } else {
            const category = data.category.trim().toLowerCase();
            // If guest payment chosen, also have to choose which booking 
            if(category === "guest payment") {
                if(utils.isEmpty(data.bookingId)) {
                    onError(`Choose booking`);
                    return false;
                } 
            }
            else if(category === "commission") {
                if(utils.isEmpty(data.bookingId)) {
                    return onError(`For category 'Commission', select which booking it pertains to`);
                }
                if(utils.isEmpty(data.activityId)) {
                    return onError(`For category 'Commission', select which activity it pertains to`);
                }
                if(utils.isEmpty(data.comments)) {
                    return onError(`For category 'Commission', please give provider name in the comments`);
                }
            }
            else if(category === "other" && utils.isEmpty(data.comments)) {
                return onError(`For category 'Other', add some comments`);
            }
        }
        
        if(utils.isEmpty(data.paymentMethod)) {
            onError(`Choose payment method`);
            return false;
        } 
        if(!utils.isDateTime(data.receivedAt)) {
            onError(`Pick a date`);
            return false;
        }
    } catch(e) {
        // In case of unexpected error, better not stop user from uploading. Return true
        onError(`Unexpected error. Screenshot and send to admin. You may also upload this anyway: ${e.message}`);
    }
    return true;
}

export async function toArrays(filters, onProgress, onError) {
    onProgress(0);

    const documents = await get(filters, onError);

    const headers = [
        "index",
        "receivedAt",
        "purchasedBy",
        "amount",
        "category",
        "paymentMethod",
        "description",
        "bookingName",
        "activityId",
        "activityCategory",
        "activitySubCategory",
        "comments",
    ];

    let rows = [headers];

    const nDocs = documents.length;
    for(let i = 0; i < nDocs; i++) {
        const document = documents[i];
        if(utils.exists(document, "bookingId")) {
            const booking = await getBooking(document.bookingId);
            document.bookingName = booking.name;

            if(utils.exists(document, "activityId")) {
                const activity = await getActivity(document.bookingId, document.activityId);
                document.activityCategory = activity.category;
                document.activitySubCategory = activity.subCategory;
            }
        }

        let values = [];
        for(const header of headers) {
            values.push((utils.exists(document, header) ? document[header] : "-"))
        }

        rows.push(values);

        onProgress(i/nDocs);
    }

    onProgress(100);
    return rows;
}
