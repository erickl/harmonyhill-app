import * as inventoryDao from "../daos/inventoryDao.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit} from "../daos/dao.js";

export async function get(filters = {}, onError) {
    const inventory = await inventoryDao.get(filters, onError);
    return inventory;
}

export async function getOne(nameOrId, onError) {
    return await inventoryDao.getOne(nameOrId, onError);
}

export async function subtract(activity, type, itemName, quantity, onError, writes = []) {
    const commit = decideCommit(writes);

    const currentQuantity = await getCurrentQuantity(itemName, onError);
    if(currentQuantity < quantity) {
        onError(`Cannot take ${quantity} from inventory of ${itemName}. Current quantity: ${currentQuantity}`);
        return false;
    }

    const stock = {
        bookingId  : activity ? activity.bookingId : null,
        house      : activity ? activity.house : null,
        activityId : activity ? activity.id : null,
        name       : itemName,
        quantity   : quantity,
        type       : type,
    };

    const result = await inventoryDao.add(stock, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function getSale(itemName, activityId, onError) {
    return await inventoryDao.getInventoryChange(itemName, "sale", activityId, onError);
}

export async function addSale(activity, itemName, quantity, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await subtract(activity, "sale", itemName, quantity, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function updateSale(activity, itemName, quantity, onError, writes = []) {
    const commit = decideCommit(writes);

    const stockChangeFilter = {
        activityId : activity.id,
        type : "sale",
    };
    const existingSales = await inventoryDao.getInventoryChanges(itemName, stockChangeFilter, onError);
    if(!existingSales || existingSales.length < 1) {
        return false;
    }
    const existingSale = existingSales[0];

    const result = await inventoryDao.updateStock(existingSale.id, itemName, {quantity : quantity}, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function refillMany(expense, quantities, onError, writes = []) {
    const commit = decideCommit(writes);

    let results = [];
    for(const [itemName, quantity] of Object.entries(quantities)) {
        const result = await refill(expense, itemName, quantity, onError, writes);
        if(result === false) return false;
        results.push(result);
    }   

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return results;
}

export async function refill(expense, itemName, quantity, onError, writes = []) {
    const commit = decideCommit(writes);

    const refill = {
        expenseId : expense.id,
        name      : itemName,
        quantity  : quantity,
        seller    : utils.isEmpty(expense.seller) ? "" : expense.seller,
        type      : "refill",
    };
    
    const result = await inventoryDao.add(refill, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

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

export async function removeSaleIfExists(name, activityId, onError, writes) {
    const invItem = await getOne(name, onError);
    if(invItem) {
        const invItemSale = await getSale(name, activityId, onError);
        if(invItemSale) {
            const removeSaleResult = await removeStockChange(invItem.id, invItemSale.id, onError, writes);
            if(removeSaleResult === false) return false;
        }
    }

    return true;
}

export async function removeStockChange(invItemId, stockChangeId, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await inventoryDao.removeStockChange(invItemId, stockChangeId, onError, writes);
    if(result === false) return false;
    if(commit) return await commitTx(writes, onError);
    return true;
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

export async function getCurrentQuantity(name, onError) {
    return await getQuantity(name, {}, onError);
}

/**
 * If someone changed an old stock count, before the month close 
 * or we suspect the count is incorrect, redo it from the beginning
 * and create new closed records on this date, today
 */ 
export async function recountAllClosedMonths(onError, onProgress, writes = []) {
    const commit = decideCommit(writes);

    const countFrom = utils.beginning();
    const countUntil = utils.today();

    const result = await closeMonthAllItems(countFrom, countUntil, onProgress, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function closeMonthAllItems(openAt, closeAt, onProgress, onError, writes = []) {
    const commit = decideCommit(writes);

    const inventoryItems = await get({}, onError);
    if(inventoryItems === false) return false;

    let closedRecords = [];
    const nItems = inventoryItems.length;
    for(let i = 0; i < nItems; i++) {
        const inventoryItem = inventoryItems[i];
        const result = await closeMonthForItem(inventoryItem.name, openAt, closeAt, onError, writes);
        if(result === false) return false;
        if(onProgress) onProgress((i+1)/nItems);
        closedRecords.push(result);
    }

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return closedRecords;
}

/**
 * 
 * @param {*} name of the inventory item
 * @param {*} openAt which date to count from. If undefined, count from last closed date
 * @param {*} closeAt which date to count until
 * @returns 
 */
export async function closeMonthForItem(name, openAt, closeAt, onError, writes = []) {
    const commit = decideCommit(writes);

    const newClosedAt = utils.isDate(closeAt) ? closeAt : utils.monthStart().plus({seconds : -1});

    const filter = {"before" : newClosedAt};
    if(utils.isDate(openAt)) filter["after"] = openAt;
    
    const totalMonthCount = await getQuantity(name, filter, onError);

    const newLastClosedRecord = {
        "quantity" : totalMonthCount,
        "closedAt" : newClosedAt,
    };

    const result = await inventoryDao.addClosedRecord(name, newLastClosedRecord, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function validateRefill(data, onValidationError) {
    if(utils.isEmpty(data.quantities)) {
        return onValidationError("Input at least one item");
    }

    let totalQuantities = 0;
    for(const [_, quantity] of Object.entries(data.quantities)) {
        totalQuantities += quantity;
    }
    if(totalQuantities === 0) {
        return onValidationError("Input at least one item");
    }

    if(utils.isEmpty(data.expense)) {
        return onValidationError("Choose an expense");
    }

    return true;
}

export async function validateSubtraction(data, onValidationError) {
    if(utils.isEmpty(data.quantity) || data.quantity == 0) {
        return onValidationError("Fill a quantity more than zero");
    }

    if(utils.isEmpty(data.type)) {
        return onValidationError("Choose a type");
    }

    if(data.type === "sale" && utils.isEmpty(data.booking)) {
        return onValidationError("Choose a booking");
    }

    return true;
}
