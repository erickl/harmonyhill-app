import * as utils from "../utils.js";
import * as incomeDao from "../daos/incomeDao.js";
import * as ledgerService from "./ledgerService.js";

export async function get(filterOptions, onError) {
    const incomes = await incomeDao.get(filterOptions, onError);
    const formattedIncomes = incomes.map((income) => {
            income.receivedAt = utils.toDateTime(income.receivedAt);
            return income;
        });
    return formattedIncomes;
}

export async function add(data, onError) {
    const object = mapIncomeObject(data);

    const addResult = await incomeDao.transaction(async () => {
        if(object.paymentMethod === "cash") {
            const pettyCashBalance = await ledgerService.updatePettyCashBalance(object.amount, onError);
            if(pettyCashBalance === false) {
                throw new Error(`Could not add petty cash balance for income`);
            }
        }

        const addResult = await incomeDao.add(object, onError);
        if(addResult === false) {
            throw new Error(`Could not add income`);
        }
        return true;
    });
    
    return addResult;
}

export async function remove(id, onError) {
    const deleteResult = await incomeDao.transaction(async () => {
        const existing = await incomeDao.getOne(id, onError);
        if(!existing) {
            throw new Error(`Could not find income record ${id}`);
        }

        const deleteRecordResult = incomeDao.remove(id, onError);
        if(!deleteRecordResult) {
            throw new Error(`Could not delete income record ${id}`);
        }

        
        if(existing.paymentMethod === "cash") {
            const updatePettyCashResult = ledgerService.updatePettyCashBalance(-1 * existing.amount, onError);
            if(!updatePettyCashResult) {
                throw new Error(`Could not update petty cash when deleting income ${id}`);
            }
        }

        return true; 
    });

    return deleteResult;
}

export async function update(id, data, onError) {
    const object = mapIncomeObject(data);

    const updateResult = await incomeDao.transaction(async () => {
        const existing = await incomeDao.getOne(id);
        if(!existing) {
            throw new Error(`Could not find existing income ${id}`);
        }

        // If both existing and new incomes are cash, just update petty cash with the difference
        if(existing.paymentMethod === "cash" && object.paymentMethod === "cash" ) {
            const amountAdjustment = object.amount - existing.amount;

            const pettyCashBalance = await ledgerService.updatePettyCashBalance(amountAdjustment, onError);
            if(pettyCashBalance === false) {
                throw new Error(`Could not update petty cash balance`);
            }
        }

        // If new income isn't cash anymore, remove existing amount from update petty cash, since petty cash wasn't used
        else if(existing.paymentMethod === "cash" && object.paymentMethod !== "cash" ) {
            const pettyCashBalance = await ledgerService.updatePettyCashBalance(-1 * existing.amount, onError);
            if(pettyCashBalance === false) {
                throw new Error(`Could not update petty cash balance`);
            }
        }

        // If both existing incomes weren't cash before, add entire amount to petty cash
        else if(existing.paymentMethod !== "cash" && object.paymentMethod === "cash" ) {
            const pettyCashBalance = await ledgerService.updatePettyCashBalance(object.amount, onError);
            if(pettyCashBalance === false) {
                throw new Error(`Could not update petty cash balance`);
            }
        }
        
        const updateResult = await incomeDao.update(id, object, onError);
        if(updateResult === false) {
            throw new Error(`Could not update income`);
        }
        return true;
    });

    return updateResult;
}

function mapIncomeObject(data) {
    let object = {};

    if(utils.isAmount(data.amount)) object.amount = data.amount;

    if(!utils.isEmpty(data.category)) {
        object.category = data.category.trim().toLowerCase();
        if(object.category === "guest payment") {
            object.bookingId = data.bookingId;
        }
    }

    if(!utils.isEmpty(data.paymentMethod)) object.paymentMethod = data.paymentMethod.trim().toLowerCase();

    if(utils.isDateTime(data.receivedAt)) object.receivedAt = utils.toFireStoreTime(data.receivedAt);

    if(!utils.isEmpty(data.description)) object.description = data.description.trim();

    if(!utils.isEmpty(data.comments)) object.comments = data.comments.trim();
    
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
        }
        // If guest payment chosen, also have to choose which booking 
        else if(data.category === "guest payment"){
            if(utils.isEmpty(data.bookingId)) {
                onError(`Choose booking`);
                return false;
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
