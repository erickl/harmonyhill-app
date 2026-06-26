import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

async function getPath(parent = null) {
    let path = [];

    if (parent) {
        path.push("steps", parent.id);
        let granderParent = await dao.getParent(parent);
        while (granderParent != null) {
            path.push("steps", granderParent.id);
            granderParent = await dao.getParent(granderParent);
        }
    }

    path.push(dao.constant.TODOS);
    path = path.reverse();
    return path;
}

export async function getOne(parent, id, onError) {
    const path = await getPath(parent);
    return await dao.getOne(path, id, onError);
}

export async function get(parent, filter, onError) {
    const path = await getPath(parent);
    
    const queryFilter = [];
    if(utils.exists(filter, "isCompleted")) {
        queryFilter.push(where("isCompleted", "==", filter.isCompleted));
    }
    
    let ordering = [ orderBy("deadlineAt", "asc") ];

    return await dao.get(path, queryFilter, ordering, -1, onError);
}

export async function add(todo, parent, onError, writes) {
    const id = createTodoId(todo);
    const path = await getPath(parent);
    return await dao.add(path, id, todo, onError, writes);
}

export async function update(todo, todoUpdate, onError, writes) {
    const parent = await dao.getParent(todo);
    const path = await getPath(parent);
    return await dao.update(path, todo.id, todoUpdate, true, onError, writes);
}

export async function remove(todo, onError, writes) {
    const parent = await dao.getParent(todo);
    const path = await getPath(parent);
    return await dao.remove(path, todo.id, onError, writes);
}

function createTodoId(todo) {
    const deadlineAt = utils.to_YYMMdd(todo.deadlineAt);
    return `${todo.assignedTo}-${deadlineAt}-${Date.now()}`;
}
