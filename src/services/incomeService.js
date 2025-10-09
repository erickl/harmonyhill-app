import * as utils from "../utils.js";
import * as incomeDao from "../daos/incomeDao.js";
import {getOne as getBooking} from "./bookingService.js";
import {getOne as getActivity} from "./activityService.js";

export async function get(filterOptions, onError) {
    const incomes = await incomeDao.get(filterOptions, {"receivedAt":"desc"}, -1, onError);
    const formattedIncomes = incomes.map((income) => {
        income.receivedAt = utils.toDateTime(income.receivedAt);
        return income;
    });
    return formattedIncomes;
}

export async function add(data, onError) {
    const object = await mapIncomeObject(data);

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

        const deleteRecordResult = await incomeDao.remove(id, onError);
        if(!deleteRecordResult) {
            throw new Error(`Could not delete income record ${id}`);
        }

        return true; 
    });

    return deleteResult;
}

export async function update(id, data, onError) {
    const object = await mapIncomeObject(data);

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
                    onError(`For category 'Commission', select which booking it pertains to`);
                    return false;
                }
                if(utils.isEmpty(data.activityId)) {
                    onError(`For category 'Commission', select which activity it pertains to`);
                    return false;
                }
                if(utils.isEmpty(data.comments)) {
                    onError(`For category 'Commission', please give provider name in the comments`);
                    return false;
                }
            }
            else if(category === "other" && utils.isEmpty(data.comments)) {
                onError(`For category 'Other', add some comments`);
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

export async function toArrays(filters, onError) {
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

    for(const document of documents) {
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
    }

    return rows;
}
