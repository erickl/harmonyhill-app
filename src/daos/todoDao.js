import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

export function subscribe(setDocs, options, onError) {
    const path = [dao.constant.TODOS];
    const queryFilter = buildQueryFilter(options); 
    return dao.subscribe(path, setDocs, queryFilter, onError);
} 

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
    
    const queryFilter = buildQueryFilter(filter);
    
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

export async function addPhoto(todo, id, data, onError, writes = []) {
    const parent = await dao.getParent(todo);
    const path = await getPath(parent);
    path.push(todo.id, "todo-photos");
    return await dao.add(path, id, data, onError, writes);
}

export async function getPhotos(todo, activityId, onError) {
    const parent = await dao.getParent(todo);
    const path = await getPath(parent);
    path.push(todo.id, "todo-photos");
    return await dao.get(path, [], [], -1, onError);
}

export async function removePhoto(todoId, id, onError, writes = []) {
    const path = [dao.constant.TODOS, todoId, "todo-photos"];
    return await dao.remove(path, id, onError, writes);
}

function buildQueryFilter(filter) {
    const queryFilter = [];

    if(utils.exists(filter, "isCompleted")) {
        if(filter.isCompleted) {
            queryFilter.push(where("status", "==", "completed"));
        } else {
            queryFilter.push(where("status", "!=", "completed"));
        }
    }

    // filtering for date >= null doesn't make sense
    if (utils.exists(filter, "after") && !utils.isEmpty(filter.after)) {
        queryFilter.push(where("deadlineAt", ">=", utils.toFireStoreTime(filter.after)));
    }

    // filtering for date <= null also doesn't make sense
    if (utils.exists(filter, "before") && !utils.isEmpty(filter.before)) {
        queryFilter.push(where("deadlineAt", "<=", utils.toFireStoreTime(filter.before)));
    }

    // filtering for date == null DOES make sense (getting unscheduled todos)
    if (utils.exists(filter, "date")) {
        queryFilter.push(where("deadlineAt", "==", utils.toFireStoreTime(filter.date)));
    }

    return queryFilter;
}
