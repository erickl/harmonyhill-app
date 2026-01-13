import * as todoDao from "../daos/todoDao.js"; 
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import {commitTx, decideCommit} from "../daos/dao.js";

export async function getOne(id, onError) {
    return await todoDao.getOne(id, onError);
}

export async function get(filter, onError) {
    return await todoDao.get(filter, onError);
}

export async function add(todo, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await todoDao.add(todo, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

export async function update(id, updateData, onError, writes = []) {
    const commit = decideCommit(writes);
       
    const result = await todoDao.update(id, updateData, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

export async function remove(todoId, onError, writes = []) {   
    const isAdmin = await userService.isAdmin();
    if(isAdmin === false) return false;

    const commit = decideCommit(writes);

    // To delete a todo, first delete all its todo steps, or they'll be dangling records (orphaned)
    const todoSteps = await getTodoSteps(todoId, onError);
    for(const todoStep of todoSteps) {
        let deleteTodoStepResult = await removeTodoStep(todoId, todoStep.id, onError, writes);
        if(deleteTodoStepResult === false) return false;
    }

    const result = await todoDao.remove(todoId, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    
    return result;
}

export async function getTodoStep(todoId, todoStepId, onError) {
    return await todoDao.getTodoStep(todoId, todoStepId, onError);
}

export async function getTodoSteps(todoId, filter, onError) {
    return await todoDao.getTodoSteps(todoId, filter, onError);
}

export async function addTodoStep(todoId, todoStep, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await todoDao.addTodoStep(todoId, todoStep, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function updateTodoStep(todoId, todoStepId, todoStepUpdate, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await todoDao.updateTodoStep(todoId, todoStepId, todoStepUpdate, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function removeTodoStep(todoId, todoStepId, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await todoDao.removeTodoStep(todoId, todoStepId, onError, writes);
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

export function validateStep(data, onError) {
    if(utils.isEmpty(data.title)) {
        return onError(`Choose title`);
    }
    if(!utils.isDateTime(data.deadlineAt)) {
        return onError(`Pick a deadline`);
    }
    return true;
}
