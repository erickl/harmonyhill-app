import * as expenseDao from "../daos/expenseDao.js";
import * as storageDao from "../daos/storageDao.js";
import * as utils from "../utils.js";
import { getOne as getActivity } from "./activityService.js";
import {getOne as getBooking} from "./bookingService.js";
import {commitTx} from "../daos/dao.js";

export async function add(data, onError, writes = []) {
    const commit = writes.length === 0;
    data.index = await expenseDao.getNextSerialNumber(data.purchasedAt, onError);
    
    data = await processReceipt(data, onError, writes);
    if(data === false) return false;

    const object = mapReceiptObject(data);

    const result = await expenseDao.add(object, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

async function processReceipt(data, onError, writes) {
     // If just editing the expense, the user might not have taken a new photo
    if(data.photo) {
        const fileDate = utils.to_YYMMdd(data.purchasedAt);
        const fileDescription = data.description.trim().toLowerCase().replace(/ /g, "-");
        data.fileName = `${data.index}. ${fileDescription}-${fileDate}-${Date.now()}`;
        data.fileName = `expenses/${data.fileName}.jpg`;
        data.photoUrl = await uploadReceipt(data.fileName, data.photo, {maxSize : 0.7}, onError, writes);
        delete data['photo'];
    }
    
    if(!data.photoUrl || data.photoUrl === false) {
        return false;
    }

    return data;
}

export async function update(id, data, onError, writes = []) {
    const commit = writes.length === 0;

    const existing = await expenseDao.getOne(id);
    if(!existing) {
        onError(`Could not find existing income ${id}`);
        return false;
    }

    data = await processReceipt(data, onError, writes);
    if(data === false) return false;

    const object = mapReceiptObject(data);
    
    const updateResult = await expenseDao.update(id, object, onError, writes);
    if(updateResult === false) return false;

    // If photo is updated, remove the old photo
    if(existing.photoUrl !== object.photoUrl) {
        const removeOldFileResult = await storageDao.removeFile(existing.fileName, onError, writes);   
        if(removeOldFileResult === false) return false;
    }

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return updateResult;
}

export async function downloadExpenseReceipts(toFilename, filters, onProgress, onError) {
    const expenses = await get(filters, onError);
    const filePaths = expenses.map((expense) => expense.fileName);
    const success = await storageDao.downloadAllZipped(toFilename, filePaths, onProgress, onError);
    return success;
}

/**
 * Upload invoice for purchases for your business (e.g. of market groceries, construction materials, etc...)
 * @param {*} filename 
 * @param {*} image 
 */
export async function uploadReceipt(filename, dataUrl, options, onError, writes = []) {
    const commit = writes.length === 0;
    const result = await storageDao.upload(filename, dataUrl, options, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
}

export async function get(filterOptions, onError) {
    const expenses = await expenseDao.get(filterOptions, {"purchasedAt":"desc"}, -1, onError);
    const formattedExpenses = expenses.map((expense) => {
        const formattedExpense = expense;
        formattedExpense.purchasedAt = utils.toDateTime(expense.purchasedAt);
        return formattedExpense;
    });
    return formattedExpenses;
}

export async function getOne(id, onError) {
    return await expenseDao.getOne(id, onError);
}

export async function remove(id, onError, writes = []) {
    const commit = writes.length === 0;

    const existing = await expenseDao.getOne(id, onError);
    if(!existing) {
        onError(`Could not find expense record ${id}`);
        return false;
    }

    const result = await expenseDao.remove(id, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
}

export async function validate(data, onError) {
    try {
        if(utils.isEmpty(data.photo) && utils.isEmpty(data.photoUrl)) {
            onError(`Upload photo`);
            return false;
        }
        if (!utils.isAmount(data.amount) || data.amount <= 0) {
            onError(`Input an amount above zero`);
            return false;
        } 
        if(utils.isEmpty(data.paymentMethod)) {
            onError(`Choose payment method`);
            return false;
        } 
        if(utils.isEmpty(data.category)) {
            onError(`Choose category`);
            return false;
        } else {
            const category = data.category.trim().toLowerCase();
            if(category === "guest expenses" || category === "guest refunds") {
                if(utils.isEmpty(data.bookingId)) {
                    onError(`Choose booking`);
                    return false;
                }
                if(utils.isEmpty(data.activityId)) {
                    onError(`Choose activity`);
                    return false;
                }
            }
        }
        if(!utils.isDateTime(data.purchasedAt)) {
            onError(`Pick a date`);
            return false;
        }
        if(utils.isEmpty(data.purchasedBy)) {
            onError(`Who was the purchaser?`);
            return false;
        }
        if(utils.isEmpty(data.description)) {
            onError(`Give description`);
            return false;
        }
    } catch(e) {
        // In case of unexpected error, better not stop user from uploading. Return true
        onError(`Unexpected error. Screenshot and send to admin. You may also upload this anyway: ${e.message}`);
    }
    return true;
}

function mapReceiptObject(data) {
    let object = {};

    if(utils.isAmount(data.amount)) object.amount = data.amount;

    if(!utils.isEmpty(data.category)) object.category = data.category.trim().toLowerCase();

    if(utils.isDateTime(data.purchasedAt)) object.purchasedAt = utils.toFireStoreTime(data.purchasedAt);

    if(utils.isAmount(data.purchasedBy)) object.purchasedBy = data.purchasedBy.trim().toLowerCase();

    if(!utils.isEmpty(data.description)) object.description = data.description.trim();

    if(!utils.isEmpty(data.paymentMethod)) object.paymentMethod = data.paymentMethod.trim().toLowerCase();

    if(!utils.isEmpty(data.comments)) object.comments = data.comments.trim();
    
    if(!utils.isEmpty(data.fileName)) object.fileName = data.fileName.trim();

    if(!utils.isEmpty(data.photoUrl)) object.photoUrl = data.photoUrl.trim();

    if(!utils.isEmpty(data.activityId)) object.activityId = data.activityId.trim();
    
    if(!utils.isEmpty(data.bookingId)) object.bookingId = data.bookingId.trim();

    if(!utils.isEmpty(data.index)) object.index = data.index;

    return object;
}

export async function toArrays(filters, onProgress, onError) {
    onProgress(0);

    const documents = await get(filters, onError);

    const headers = [
        "index",
        "purchasedAt",
        "purchasedBy",
        "amount",
        "category",
        "paymentMethod",
        "description",
        "filename",
        "bookingName",
        "activityCategory",
        "activitySubCategory",
        "customerPrice",
        "providerPrice",
        "activityId",
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
                document.customerPrice = activity.customerPrice;
                document.providerPrice = activity.providerPrice;
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
