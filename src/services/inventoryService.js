import * as inventoryDao from "../daos/inventoryDao.js";

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
        type     : "refill",
    };
    
    const result = await inventoryDao.add(refill, onError);
    return result;
}
