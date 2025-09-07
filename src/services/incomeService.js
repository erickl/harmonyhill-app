import * as utils from "../utils.js";
import * as incomeDao from "../daos/incomeDao.js";

export async function get(filterOptions, onError) {
    const incomes = await incomeDao.get(filterOptions, -1, onError);
    const formattedIncomes = incomes.map((income) => {
        income.receivedAt = utils.toDateTime(income.receivedAt);
        return income;
    });
    return formattedIncomes;
}

export async function add(data, onError) {
    const object = mapIncomeObject(data);

    const addResult = await incomeDao.transaction(async () => {
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
        else {
            const category = data.category.trim().toLowerCase();
            if(category === "guest payment") {
                if(utils.isEmpty(data.bookingId)) {
                    onError(`Choose booking`);
                    return false;
                } 
            }
            else if(category === "commission") {
                if(utils.isEmpty(data.bookingId)) {
                    onError(`If category is 'Commission', select which booking it came from`);
                    return false;
                }
                if(utils.isEmpty(data.comments)) {
                    onError(`If category is 'Commission', write provider name in the comments`);
                    return false;
                }
            }
            else if(category === "other" && utils.isEmpty(data.comments)) {
                onError(`If category is 'Other', write what it is in the comments`);
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
    } catch(e) {
        // In case of unexpected error, better not stop user from uploading. Return true
        onError(`Unexpected error. Screenshot and send to admin. You may also upload this anyway: ${e.message}`);
    }
    return true;
}
