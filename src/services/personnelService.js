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
}

export async function update(personnelId, personnelUpdateData) {
    const updatedPersonnel = await mapPersonnelObject(personnelUpdateData, true);
    return await personnelDao.update(personnelId, updatedPersonnel);
}

function makePersonnelId(personnel) {
    let name = personnel.name.replace(/ /g, '-');
    name = name.toLowerCase();
    return `${personnel.activity.toLowerCase()}-${name}`;
}

async function mapPriceObject(data, isUpdate = false) {
    let object = {};
    if(Object.hasOwn(data, "name"))        object.name     = data.name;
    if(Object.hasOwn(data, "activity"))    object.activity = data.activity.toLowerCase();
    if(Object.hasOwn(data, "subCategory")) object.subCategory = data.subCategory.toLowerCase();
    if(Object.hasOwn(data, "price"))       object.price = data.price;
    
    // Transport data
    if(Object.hasOwn(data, "to"))          object.to = data.to;
    if(Object.hasOwn(data, "from"))        object.from = data.from;

    if(!isUpdate) {
        object.createdAt = new Date();
        object.createdBy = await userService.getUserName();
    }

    return object;
}

async function mapPersonnelObject(data, isUpdate = false) {
    let object = {};

    if(Object.hasOwn(data, "name"))     object.name     = data.name;
    if(Object.hasOwn(data, "activity")) object.activity = data.activity.toLowerCase();
    if(Object.hasOwn(data, "location")) object.location = data.location.toLowerCase();
    if(Object.hasOwn(data, "price"))    object.price    = data.price;
    if(Object.hasOwn(data, "whatsapp")) {
        object.whatsapp = data.whatsapp.replace(/ /g, '');
    }
    
    if(!isUpdate) {
        object.createdAt = new Date();
        object.createdBy = await userService.getUserName();
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
    if (personnelId) {
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
