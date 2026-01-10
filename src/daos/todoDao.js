import * as dao from "./dao.js";
import * as utils from "../utils.js";

const todoPath = [dao.constant.TODOS];

export async function getOne(id, onError) {
    return await dao.getOne([dao.constant.TODOS], id, onError);
}

export async function get(filter, onError) {
    return await dao.get(todoPath, filter, [], -1, onError);
}

export async function getTodoSteps(todoId, filter, onError) {
    const path = [...todoPath, todoId, dao.constant.TODO_STEPS];
    return await dao.get(path, filter, [], -1, onError);
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

export async function removeTodoStep(todoId, todoStepId, onError, writes) {
    const path = [...todoPath, todoId, dao.constant.TODO_STEPS];
    return await dao.remove(path, todoStepId, onError, writes);
}

function createTodoId(todo) {
    const deadline = utils.to_YYMMdd(todo.deadline);
    return `${todo.assignedTo}-${deadline}-${Date.now()}`;
}