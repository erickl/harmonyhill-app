import * as inventoryDao from "../daos/inventoryDao.js";
import * as utils from "../utils.js";

export async function addSale(booking, itemName, quantity, onError) {
    const sale = {
        bookingId : booking.id,
        house     : booking.house,
        name      : itemName,
        quantity  : quantity,
        type      : "sale",
    };
    const result = await inventoryDao.add(sale, onError);
    return result;
}

export async function refill(expense, itemName, quantity, onError) {
    const refill = {
        expense  : expense.id,
        name     : itemName,
        quantity : quantity,
        seller   : utils.isEmpty(expense.seller) ? "" : expense.seller,
        type     : "refill",
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
    if(!utils.exists(filter, "after")) {
        const lastClosedRecord = await getLastClosedRecord(name, onError);
        if(lastClosedRecord) {
            filter.after = lastClosedRecord.closedAt;
        }
    }  

    const sales = await getSales(name, filter, onError);
    const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    const refills = await getRefills(name, filter, onError);
    const totalRefills = refills.reduce((sum, refill) => sum + refill.quantity, 0);

    const currentCount = lastClosedRecord.count + totalRefills - totalSales;
    return currentCount;
}

export async function closeMonthForItem(name, onError) {
    const lastClosedRecord = await getLastClosedRecord(name, onError);
    if(!lastClosedRecord) return false;

    const newClosedAt = utils.monthStart().plus({seconds : -1});

    const totalMonthCount = await getQuantity(name, {"before" : newClosedAt}, onError);

    const newLastClosedRecord = {
        "count" : totalMonthCount,
        "closedAt" : newClosedAt,
    };

    const result = await inventoryDao.addClosedRecord(name, newLastClosedRecord, onError);
    return result;
}
