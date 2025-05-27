import * as personnelDao from "../daos/personnelDao.js";
import * as utils from "../utils.js";
import * as userService from "./userService.js";

/**
 * 
 * @param {*} filterOptions = { name|activity=transport|yoga|etc...|location="Maniktawang"}
 */
export async function get(filterOptions = {}) {
    // filter for
    //      location? e.g. Maniktawang
    // order by 
    //      last used? 
    //
    //      cheapest?
    const personnel = await personnelDao.get(filterOptions);
    return personnel;
}

export async function add(personnelData) {
    const personnel = await mapPersonnelObject(personnelData);
    const personnelId = "";
    const success = await personnelDao.add(personnelId, personnel);
    if(success) {
        return personnelId;
    }

    return false;
}

export async function update(personnelId, personnelUpdateData) {
    const updatedPersonnel = await mapPersonnelObject(personnelUpdateData, true);
    return await personnelDao.update(personnelId, updatedPersonnel);
}

async function mapPersonnelObject(data, isUpdate = false) {
    let object = {};

    if(Object.hasOwn(data, "name"))     object.name     = data.name;
    if(Object.hasOwn(data, "activity")) object.activity = data.activity;
    if(Object.hasOwn(data, "price"))    object.price    = data.price;

    if(!isUpdate) {
        object.createdAt = new Date();
        object.createdBy = await userService.getUserName();
    }

    return object;
}
