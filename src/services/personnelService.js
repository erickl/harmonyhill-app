import * as personnelDao from "../daos/personnelDao.js";
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import {commitTx} from "../daos/dao.js";

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
export async function add(personnelData, onError, writes = []) {
    const commit = writes.length === 0;

    const personnel = await mapPersonnelObject(personnelData);
    const personnelId = makePersonnelId(personnel);
    const result = await personnelDao.add(personnelId, personnel, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
}

export async function update(personnelId, personnelUpdateData, onError, writes = []) {
    const commit = writes.length === 0;

    const updatedPersonnel = await mapPersonnelObject(personnelUpdateData, true);
    const result = await personnelDao.update(personnelId, updatedPersonnel, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
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
