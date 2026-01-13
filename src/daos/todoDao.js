import * as dao from "./dao.js";
import * as utils from "../utils.js";

const todoPath = [dao.constant.TODOS];

export async function getOne(id, onError) {
    return await dao.getOne([dao.constant.TODOS], id, onError);
}

export async function get(filter, onError) {
    return await dao.get(todoPath, filter, [], -1, onError);
}

export async function add(todo, onError, writes) {
    const id = createTodoId(todo);
    return await dao.add(todoPath, id, todo, onError, writes);
}

export async function update(id, todoUpdate, onError, writes) {
    return await dao.update(todoPath, id, todoUpdate, true, onError, writes);
}

export async function remove(id, onError, writes) {
    return await dao.remove(todoPath, id, onError, writes);
}

function createTodoId(todo) {
    const deadlineAt = utils.to_YYMMdd(todo.deadlineAt);
    return `${todo.assignedTo}-${deadlineAt}-${Date.now()}`;
}

export async function getTodoStep(todoId, todoStepId, onError) {
    const path = [...todoPath, todoId, dao.constant.TODO_STEPS];
    return await dao.getOne(path, todoStepId, onError);
}

export async function getTodoSteps(todoId, filter, onError) {
    const path = [...todoPath, todoId, dao.constant.TODO_STEPS];
    return await dao.get(path, filter, [], -1, onError);
}

export async function addTodoStep(todoId, todoStep, onError, writes) {
    const path = [...todoPath, todoId, dao.constant.TODO_STEPS];
    const id = createTodoStepId(todoId, todoStep);
    return await dao.add(path, id, todoStep, onError, writes);
}

export async function updateTodoStep(todoId, todoStepId, todoStepUpdate, onError, writes) {
    const path = [...todoPath, todoId, dao.constant.TODO_STEPS];
    return await dao.update(path, todoStepId, todoStepUpdate, true, onError, writes);
}

export async function removeTodoStep(todoId, todoStepId, onError, writes) {
    const path = [...todoPath, todoId, dao.constant.TODO_STEPS];
    return await dao.remove(path, todoStepId, onError, writes);
}

function createTodoStepId(todoId, todoStep) {
    return `step-${todoId}-${Date.now()}`;
}
