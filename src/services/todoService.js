import * as todoDao from "../daos/todoDao.js"; 
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import {commitTx, decideCommit} from "../daos/dao.js";

export async function getOne(parent, id, onError) {
    return await todoDao.getOne(parent, id, onError);
}

export async function get(parent, filter, onError) {
    return await todoDao.get(parent, filter, onError);
}

export async function add(todo, parent, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await todoDao.add(todo, parent, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

export async function update(todo, updateData, onError, writes = []) {
    const commit = decideCommit(writes);
       
    const result = await todoDao.update(todo, updateData, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

export async function setStatus(todo, isCompleted, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await update(todo, {isCompleted : isCompleted}, onError, writes);

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

export async function remove(todo, onError, writes = []) {   
    const isAdmin = await userService.isAdmin();
    if(isAdmin === false) return false;

    const commit = decideCommit(writes);

    // First delete all its todo steps, or they'll be dangling records
    const todoSteps = await get(todo, {}, onError);
    for(const todoStep of todoSteps) {
        const removeStepResult = await remove(todoStep, onError, writes);
        if(removeStepResult === false) return false;
    }

    const result = await todoDao.remove(todo, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    
    return result;
}

export function validate(data, onError) {
    if(utils.isEmpty(data.title)) {
        return onError(`Choose title`);
    }
    if(!utils.isDateTime(data.deadlineAt)) {
        return onError(`Pick a deadline`);
    }
    return true;
}
