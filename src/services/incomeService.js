import * as utils from "../utils.js";
import * as incomeDao from "../daos/incomeDao.js";

export async function get(filterOptions, onError) {
    const incomes = await incomeDao.get(filterOptions, onError);
    return incomes;
}

export async function add(data, onError) {
    const object = mapIncomeObject(data);
    const receipts = await incomeDao.add(object, onError);
    return receipts;
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
