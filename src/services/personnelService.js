import * as personnelDao from "../daos/personnelDao.js";
import * as utils from "../utils.js";
import * as userService from "./userService.js";

/**
 * @param {*} filterOptions = { name|activity=transport|yoga|etc...|location=Maniktawang|outside}
 */
export async function get(filterOptions = {}) {
    const personnel = await personnelDao.get(filterOptions);
    return personnel;
}

/**
 * 
 * @param {*} personnelData = {name, activity=yoga|transport|etc..., location=maniktawang|other, price, whatsapp}
 * @returns personnelId if added successfully, otherwise false
 */
export async function add(personnelData) {
    const personnel = await mapPersonnelObject(personnelData);
    const personnelId = makePersonnelId(personnel);
    const success = await personnelDao.add(personnelId, personnel);
    if(success) {
        return personnelId;
    }

    return false;
}

/**
 * 
 * @param {*} personnelId 
 * @param {*} priceData 
 */
export async function addPrice(personnelId, priceData) {
    const personnel = await personnelDao.getOne(personnelId);
    if(!personnel) {
        console.error(`Personnel with ID ${personnelId} not found.`);
        return false;
    }

    const price = mapPriceObject(priceData); 
    // todo: in progress...
}

export async function update(personnelId, personnelUpdateData) {
    const updatedPersonnel = await mapPersonnelObject(personnelUpdateData, true);
    return await personnelDao.update(personnelId, updatedPersonnel);
}

function makePersonnelId(personnel) {
    const name = personnel.name.trim().toLowerCase().replace(/ /g, '-');
    const activity = personnel.activity.trim().toLowerCase();
    return `${activity}-${name}-${Date.now()}`;
}

async function mapPriceObject(data, isUpdate = false) {
    let object = {};
    if(utils.exists(data, "name"))        object.name     = data.name;
    if(typeof data?.activity === "string") object.activity = data.activity.toLowerCase();
    if(typeof data?.subCategory === "string") object.subCategory = data.subCategory.toLowerCase();
    if(utils.exists(data, "price"))       object.price = data.price;
    
    // Transport data
    if(utils.exists(data, "to"))          object.to = data.to;
    if(utils.exists(data, "from"))        object.from = data.from;

    return object;
}

async function mapPersonnelObject(data, isUpdate = false) {
    let object = {};

    if(utils.isString(data?.name))     object.name     = data.name;
    if(utils.isString(data?.activity)) object.activity = data.activity.toLowerCase();
    if(utils.isString(data?.location)) object.location = data.location.toLowerCase();
    if(utils.isAmount(data?.price))    object.price    = data.price;
    if(utils.isString(data?.whatsapp)) {
        object.whatsapp = data.whatsapp.replace(/ /g, '');
    }

    return object;
}

export async function testPersonnel() {
    const personnel = {
        name: "John Doe",
        activity: "Yoga",
        price: 100
    };

    const personnelId = await add(personnel);
    if (personnelId !== false) {
        console.log(`Personnel added with ID: ${personnelId}`);
    } else {
        console.error("Failed to add personnel");
    }

    const updatedPersonnel = await update(personnelId, { price: 120 });
    if (updatedPersonnel) {
        console.log(`Personnel updated successfully`);
    } else {
        console.error("Failed to update personnel");
    }

    const personnelList = await get({ activity: "Yoga" });
    if (personnelList && personnelList.length > 0) {
        console.log(`Found ${personnelList.length} personnel for Yoga activity`);
    } else {
        console.error("No personnel found for Yoga activity");
    }
    return personnelList;
}
