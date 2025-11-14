import * as menuService from "./menuService.js";
import * as inventoryService from "./inventoryService.js";
import * as bookingDao from "../daos/bookingDao.js";
import * as utils from "../utils.js";
import {transaction} from "../daos/dao.js";

export async function addOrEdit(booking, minibar, onError) {
    minibar.items = filterZeroCounts(minibar.items);

    let result = false;

    const existing = await bookingDao.getExistingMinibar(minibar, onError);

    if(existing !== null) {
        result = await bookingDao.updateMinibar(booking.id, existing.id, minibar, onError);
    }
    else {
        result = await bookingDao.addMinibar(booking, minibar, onError);
    }

    if(result === false) {
        return false;
    }

    if(minibar.type === "end") {
        const itemsSold = await calculateSale(booking, onError);
        const minibarSale = {
            type : "sale",
            items : itemsSold,
        };
        const addSalesResult = await addSale(booking, minibarSale, onError)
        return addSalesResult;
    }

    return result;
}

async function addSale(booking, minibarSale, onError) {
    const result = transaction(async() => {
        minibarSale.items = filterZeroCounts(minibarSale.items);
        const addSalesResult = await addOrEdit(booking, minibarSale, onError);
        if(addSalesResult === false) {
            throw new Error(`Couldn't add/edit minibar sale for ${booking.id}`);
        }

        for(const [name, quantity] of Object.entries(minibarSale.items)) {
            if(quantity > 0) {
                const addInventorySaleResult = await inventoryService.addSale(booking, name, quantity, onError);
                if(addInventorySaleResult === false) {
                    throw new Error(`Couldn't add inventory sale for ${name} (booking ${booking.id})`);
                }
            }
        }
        
        return addSalesResult;
    });

    return result;
}

export async function calculateSale(booking, onError) {
    const startCount = await getType(booking, "start", onError);
    if(!startCount) onError("No start count found for this booking");

    const totalRefills = await getTotalRefills(booking, onError);

    const endCount = await getType(booking, "end", onError);
    if(!endCount) onError("No end count found for this booking");
    
    const totalProvided = startCount.items;
    Object.entries(totalRefills).forEach(([name, quantity]) => {
        totalProvided[name] = utils.exists(totalProvided, name) ? totalProvided[name] + quantity : quantity;
    });

    const sales = {};
    Object.entries(endCount.items).forEach(([name, quantity]) => {
        sales[name] = totalProvided[name] - quantity;
    });

    return sales;
}

export async function getTotalRefills(booking, onError) {
    const refills = await get(booking, {"type": "refill"}, onError);

    const total = refills.reduce((map, refill) => {
        Object.entries(refill.items).forEach(([name, quantity]) => {
            map[name] = utils.exists(map, name) ? map[name] + quantity : quantity;  
        });
        return map;
    }, {});

    return total;
}

/**
 * @param {*} booking the booking object
 * @param {*} filters type=sale|end|start|refill, activityId, bookingId
 * @param {*} onError 
 * @returns 
 */
export async function get(booking, filters, onError) {
    return await bookingDao.getMinibar(booking, filters, onError);
}

export default async function getType(booking, type, onError) {
    const startCounts = await get(booking, {"type": type}, onError);
    if(!startCounts || startCounts.length === 0) return null;
    return startCounts[0];
}


export async function getSelection(onError) {
    const filter = { meal: "minibar" };
    const minibarSelection = await menuService.get(filter, onError);
    return minibarSelection;
}

/**
 * Filter out key-value pairs where the value is less than 1
 * @param {*} items a json object (a map with key-value pairs, where the value is a number)
 */
function filterZeroCounts(items) {
    const nonZeroItems = Object.entries(items).filter(([_, quantity]) => quantity > 0);
    return Object.fromEntries(nonZeroItems);
}
