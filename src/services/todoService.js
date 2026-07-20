import * as todoDao from "../daos/todoDao.js"; 
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import * as ActivityStatus from "../models/ActivityStatus.js";
import {Alert} from "../models/Alert.js";
import {commitTx, decideCommit} from "../daos/dao.js";

/**
 * Get the collection which is updated live as updates come in from other users
 * @param {*} setDocs, the setter callback, in which to save the updating DB documents 
 * @param {*} filterOptions 
 * @param {*} onError 
 */
export function subscribe(setDocs, filterOptions = {}, onError) {
    return todoDao.subscribe(setDocs, filterOptions, onError);
}

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
    const currentUser = await userService.getCurrentUser();

    // For the change logs logic, enrich update data with latest assigned user info
    if(utils.isEmpty(updateData.assignedTo)) {
        updateData.assignedTo = todo.assignedTo ?? null;
    }

    // If (updated) assignee is current user, no need for a change log. And accept immediately
    if(updateData.assignedTo === currentUser.name) {
        updateData.changeDescription = null;
        updateData.assigneeAccept = true;
    // When changing assignee, they have to check and accept task anew
    } else if(!utils.isEmpty(updateData.assignedTo) && todo.assignedTo !== updateData.assignedTo) {
        updateData.changeDescription = null;
        updateData.assigneeAccept = false;
    // If assignee already accepted but there new changes, make change log
    } else if(todo.assigneeAccept) {
        updateData.changeDescription = makeChangeLog(todo, updateData);
        updateData.assigneeAccept = false;
    // Change logs only emptied once assignee accepts. If there are existing change logs, append to them
    } else if(!utils.isEmpty(todo.changeDescription)) {
        updateData.changeDescription = makeChangeLog(todo, updateData);
    // There are no existing change logs & assignee hasn't accepted task yet. No need for new change logs
    } else {}
       
    const result = await todoDao.update(todo, updateData, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

export async function assigneeAccept(todo, isAccepted, onError, writes = []) {
    const commit = decideCommit(writes);

    const updateData = {
        assigneeAccept : isAccepted,
        changeDescription : null,
    };
    const result = await update(todo, updateData, onError, writes);

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }
    return result;
}

export async function setStatus(todo, newStatus, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await update(todo, {status : newStatus}, onError, writes);

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

export async function uploadPhoto(todo, fileData, onError, writes = []) {
    const commit = decideCommit(writes);

    if(fileData.downloadUrl === false) {
        return;
    }
    const id = `todo-photo-${Date.now()}`;
    const data = {
        fileName   : fileData.filename,
        url        : fileData.url,
        todoId     : todo.id,
    };

    const result = await todoDao.addPhoto(todo, id, data, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function getPhotos(todo, onError) {
    return await todoDao.getPhotos(todo, onError);
} 

export function getTodoPhotoFilePath(todo) {
    if(!todo) return "";
    const date = utils.to_yyMMM(todo.deadlineAt, "-");
    const filePath = `todos/photos/${date}/${todo.id}`;
    return filePath;
}

export async function getStatus(todo, onError) {
    if(todo == null) return ActivityStatus.None;

    if(utils.isEmpty(todo.assignedTo)) {
        if(utils.isBeforeToday(todo.deadlineAt)) {
            return ActivityStatus.AssignStaff.withMessage("Staff assignment overdue!");
        // If activity is today, assigning staff
        } else if(utils.isToday(todo.deadlineAt)) {
            return ActivityStatus.AssignStaff;
        // Start assigning staff after 17:00 the day before the activity
        } else if(utils.isTomorrow(todo.deadlineAt)) {
            const todayAtFivePm = utils.today().set({hour: 17});
            if(utils.isPast(todayAtFivePm)) {
                return ActivityStatus.AssignStaff;
            }
        } 
    }

    if(utils.isEmpty(todo.deadlineTime)) {
        return ActivityStatus.DetailsMissing.withMessage("Set starting time");
    }

    if(todo.assigneeAccept !== true) {
        if(utils.isTomorrow(todo.deadlineAt) || utils.isToday(todo.deadlineAt)) {
            return ActivityStatus.StaffNotConfirmed;
        }
    }

    if(ActivityStatus.Started.equals(todo.status)) {
        return ActivityStatus.Started;
    }

    if(ActivityStatus.Completed.equals(todo.status)) {
        return ActivityStatus.Completed;
    }

    return ActivityStatus.GoodToGo;
}

export async function getAlert() {
    return Alert.NONE; // todo
}

export function validate(data, onError) {
    if(utils.isEmpty(data.title)) {
        return onError(`Choose title`);
    }
    if(!utils.isDateTime(data.deadlineAt)) {
        return onError(`Pick a deadline`);
    }
    if(utils.isEmpty(data.duration)) {
        return onError(`Set estimated duration (in minutes)`)
    }
    return true;
}

export function makeChangeLog(oldData, newData) {
    let changeLog = [];

    if(!newData) return changeLog;
    if(!oldData) return newData;

    if(utils.exists(oldData, "changeDescription") && !utils.isEmpty(oldData.changeDescription) && Array.isArray(oldData.changeDescription)) {
        changeLog = oldData.changeDescription;
    }

    const exceptions = ["assignedTo", "assigneeAccept"];

    for(const key of Object.keys(newData)) {
        const newVal = newData[key];
        const oldVal = oldData[key];
        let change = false;

        if(exceptions.includes(key)) {
            // do nothing
        } else if(utils.isDate(newVal) && !utils.dateIsSame(oldVal, newVal)) {
            change = true;
        } else if(utils.isJsonObject(newVal)) {
            const innerChangeLog = makeChangeLog(oldVal, newVal);
            changeLog = [...changeLog, ...innerChangeLog];
        } else {
            if(newVal !== oldVal) {
                change = true;
            }
        }

        if(change) {
            changeLog.push(`New ${key}: ${oldVal} --> ${newVal}`);
        } 
    }
    
    return changeLog;
}