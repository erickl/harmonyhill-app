import * as inventoryDao from "../daos/inventoryDao.js";
import * as utils from "../utils.js";

export async function get(filters = {}, onError) {
    const inventory = await inventoryDao.get(filters, onError);
    return inventory;
}

export async function subtract(booking, type, itemName, quantity, onError) {
    const stock = {
        bookingId : booking ? booking.id : null,
        house     : booking ? booking.house : null,
        name      : itemName,
        quantity  : quantity,
        type      : type,
    };
    const result = await inventoryDao.add(stock, onError);
    return result;
}

export async function addSale(booking, itemName, quantity, onError) {
    return await subtract(booking, "sale", itemName, quantity, onError);
}

export async function refill(expense, itemName, quantity, onError) {
    const refill = {
        expenseId : expense.id,
        name      : itemName,
        quantity  : quantity,
        seller    : utils.isEmpty(expense.seller) ? "" : expense.seller,
        type      : "refill",
    };
    
    const result = await inventoryDao.add(refill, onError);
    return result;
}

export async function getLastClosedRecord(name, onError) {
    const lastClosedRecord = await inventoryDao.getLastClosedRecord(name, onError);
    return lastClosedRecord;
}

export async function getSales(name, filters, onError) {
    filters.type = "sale";
    const sales = await inventoryDao.getInventoryChanges(name, filters, onError);
    return sales;
}

export async function getRefills(name, filters, onError) {
    filters.type = "refill";
    const purchases = await inventoryDao.getInventoryChanges(name, filters, onError);
    return purchases;
}

/**
 * 
 * @param {*} name of the inventory item 
 * @param {*} filter: Include "before" and date, to return quantity until a certain date
 * @param {*} onError 
 * @returns the amount of remaining stock of the named inventory item
 */
export async function getQuantity(name, filter, onError) {
    let startQuantity = 0;

    if(!utils.exists(filter, "after")) {
        const lastClosedRecord = await getLastClosedRecord(name, onError);
        if(lastClosedRecord) {
            filter.after = lastClosedRecord.closedAt;
            startQuantity = lastClosedRecord.quantity;
        }
    }  

    const sales = await getSales(name, filter, onError);
    const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    const refills = await getRefills(name, filter, onError);
    const totalRefills = refills.reduce((sum, refill) => sum + refill.quantity, 0);

    const currentCount = startQuantity + totalRefills - totalSales;
    return currentCount;
}

export async function closeMonthForItem(name, onError) {
    const lastClosedRecord = await getLastClosedRecord(name, onError);
    if(!lastClosedRecord) return false;

    const newClosedAt = utils.monthStart().plus({seconds : -1});

    const totalMonthCount = await getQuantity(name, {"before" : newClosedAt}, onError);

    const newLastClosedRecord = {
        "quantity" : totalMonthCount,
        "closedAt" : newClosedAt,
    };

    const result = await inventoryDao.addClosedRecord(name, newLastClosedRecord, onError);
    return result;
}

export async function validateRefill(data, onValidationError) {
    if(utils.isEmpty(data.quantity) || data.quantity == 0) {
        onValidationError("Fill a quantity more than zero");
        return false;
    }

    if(data.expense === null) {
        onValidationError("Choose an expense");
        return false;
    }

    return true;
}

export async function validateSubtraction(data, onValidationError) {
    if(utils.isEmpty(data.quantity) || data.quantity == 0) {
        onValidationError("Fill a quantity more than zero");
        return false;
    }

    if(data.booking === null) {
        onValidationError("Choose a booking");
        return false;
    }

     if(utils.isEmpty(data.type)) {
        onValidationError("Choose a type");
        return false;
    }

    return true;
}
