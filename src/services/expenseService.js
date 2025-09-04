import * as ledgerService from './ledgerService.js';
import * as expenseDao from "../daos/expenseDao.js";
import * as utils from "../utils.js";

export async function add(data, onError) {
    const object = mapReceiptObject(data);

    const addResult = await expenseDao.transaction(async () => {
        object.balance = await ledgerService.updatePettyCashBalance(-1 * object.amount, onError);
        if(object.balance === false) {
            throw new Error(`Could not update cash balance`);
        }
        const addResult = await expenseDao.add(object, onError);
        if(addResult === false) {
            throw new Error(`Could not add the receipt`);
        }
        return true;
    })
    
    return addResult;
}

export async function update(id, data, onError) {
    const object = mapReceiptObject(data);
    const updateResult = await expenseDao.transaction(async () => {
        const existingExpense = await expenseDao.getOne(id);
        if(!existingExpense) {
            throw new Error(`Could not find existing income ${id}`);
        }
        const amountAdjustment = object.amount - existingExpense.amount;

        object.balance = await ledgerService.updatePettyCashBalance(-1 * amountAdjustment, onError);
        if(object.balance === false) {
            throw new Error(`Could not update cash balance`);
        }
        const updateResult = await expenseDao.update(id, object, onError);
        if(updateResult === false) {
            throw new Error(`Could not update the receipt`);
        }

        // If photo is updated, remove the old photo
        if(existingExpense.photoUrl !== object.photoUrl) {
            await expenseDao.removeImage(existingExpense.fileName);
        }

        return true;
    });
    
    return updateResult;
}

/**
 * Upload invoice for purchases for your business (e.g. of market groceries, construction materials, etc...)
 * @param {*} filename 
 * @param {*} image 
 */
export async function uploadReceipt(filename, file, compressionOptions, onError) {
    if(!utils.isEmpty(compressionOptions)) {
        file = await expenseDao.compressImage(file, compressionOptions, onError);
    }
    const imageDataUrl = await expenseDao.blobToBase64(file);
    return await expenseDao.uploadImage(filename, imageDataUrl, onError);
}

export async function get(filterOptions, onError) {
    const expenses = await expenseDao.get(filterOptions, onError);
    const formattedExpenses = expenses.map((expense) => {
        const formattedExpense = expense;
        formattedExpense.purchasedAt = utils.toDateTime(expense.purchasedAt);
        return formattedExpense;
    });
    return formattedExpenses;
}

export async function remove(id, onError) {
    const deleteResult = await expenseDao.transaction(async () => {
        const existing = await expenseDao.getOne(id, onError);
        if(!existing) {
            throw new Error(`Could not find expense record ${id}`);
        }

        const deleteRecordResult = expenseDao.remove(id, onError);
        if(!deleteRecordResult) {
            throw new Error(`Could not delete expense record ${id}`);
        }

        const updatePettyCashResult = ledgerService.updatePettyCashBalance(existing.amount, onError);
        if(!updatePettyCashResult) {
            throw new Error(`Could not update petty cash for record ${id}`);
        }

        return true; 
    });
    
    return deleteResult;
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
        if(utils.isEmpty(data.category)) {
            onError(`Choose category`);
            return false;
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

    if(!utils.isEmpty(data.comments)) object.comments = data.comments.trim();
    
    if(!utils.isEmpty(data.fileName)) object.fileName = data.fileName.trim();

    if(!utils.isEmpty(data.photoUrl)) object.photoUrl = data.photoUrl.trim();

    return object;
}
