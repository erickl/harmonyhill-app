import * as mealService from './mealService.js';
import * as activityService from './activityService.js';
import * as invoiceDao from "../daos/invoiceDao.js";
import * as utils from "../utils.js";

/**
 * @param {*} bookingId 
 * @returns json with itemized list of all a booking's activities and the total amount owed 
 */
export async function getTotal(bookingId) {
    const activities = await activityService.get(bookingId);
    const nonFreeActivities = activities.filter(activity => activity.customerPrice > 0);
    
    const itemizedList = await Promise.all(
        nonFreeActivities.map(async function(activity) {
            let activityItem = {
                name:          activity.category + ": " + activity.subCategory,
                customerPrice: activity.customerPrice,
                date:          activity.startingAt,
                isFree:        activity.isFree
            }
            if(activity.category === "meal") {
                const dishes = await mealService.getDishes(bookingId, activity.id);
                activityItem.dishes = dishes;
            }
            return activityItem;  
        })
    );

    const totalSum = itemizedList.reduce((sum, item) => {
        const itemCost = item && !item.isFree && !utils.isEmpty(item.customerPrice) ? item.customerPrice : 0;
        return sum + itemCost;
    }, 0);

    return {
        total: totalSum,
        itemizedList : itemizedList
    }
}

export async function createCsvInvoice(bookingId) {
    // todo
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); 
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Upload invoice for purchases for your business (e.g. of market groceries, construction materials, etc...)
 * @param {*} filename 
 * @param {*} image 
 */
export async function uploadPurchaseInvoice(filename, file, compressionOptions, onError) {
    if(!utils.isEmpty(compressionOptions)) {
        file = await invoiceDao.compressImage(file, compressionOptions, onError);
    }
    const imageDataUrl = await blobToBase64(file);
    return await invoiceDao.uploadImage(filename, imageDataUrl, onError);
}

export async function getPurchaseInvoices(filterOptions = {}, onError) {
    const receipts = await invoiceDao.getPurchaseInvoices(filterOptions, onError);
    return receipts;
}

export async function addPurchaseInvoice(data, onError) {
    const object = mapReceiptObject(data);
    const result = await invoiceDao.addPurchaseInvoice(object, onError);
    return result;
}

export async function validate(data, onError) {
    try {
        if(utils.isEmpty(data.photo)) {
            onError(`Upload photo`);
            return false;
        }
        if (!utils.isAmount(data.amount) || data.amount <= 0) {
            onError(`Input amount above zero`);
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

// Create a description like this "1x Bolognese (free, no spicy)" 
export function dishReceiptLine(dishData) {
    const dishItem = `${dishData.quantity}x ${dishData.name}`;

    let dishComments = "";
    if(dishData.isFree === true) {
        dishComments += "free";
    }
    if(utils.isString(dishData.comments)) {
        if(dishData.isFree) dishComments += ", "; 
        dishComments += dishData.comments.trim();
    }
    if(dishComments.length > 0) {
        dishComments = ` (${dishComments})`;
    }
    
    return dishItem + dishComments;
}
