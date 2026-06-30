import * as todoDao from "../daos/todoDao.js"; 
import * as utils from "../utils.js";
import * as userService from "./userService.js";
import * as ActivityStatus from "../models/ActivityStatus.js";
import {Alert} from "../models/Alert.js";
import {commitTx, decideCommit} from "../daos/dao.js";
import { duration } from "@mui/material";

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

    const changeAssignee = utils.exists(updateData, "assignedTo") && utils.isString(updateData.assignedTo) && todo.assignedTo !== updateData.assignedTo;
    const assignee = changeAssignee ? updateData.assignedTo : todo.assignedTo;
    const selfUpdate = currentUser.shortName === assignee;

    if(changeAssignee) {
        // If updated yourself, accepting task not needed, since it counts as you noticing the task anyway
        updateData.assigneeAccept = selfUpdate;
        updateData.changeDescription = null;
    } else { // same assignee
        const changeLog = makeChangeLog(todo, updateData);
        if(!utils.isEmpty(changeLog)) {
            updateData.assigneeAccept = selfUpdate;
        }
    }
       
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
        changeDescription : null
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

    return ActivityStatus.None;
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
    
    if(!utils.dateIsSame(oldData.deadlineAt, newData.startingAt)) {
        changeLog.push(`New deadline date: from ${utils.to_yyMMddHHmm(oldData.deadlineAt, "/")} to ${utils.to_yyMMddHHmm(newData.deadlineAt, "/")}`);
    }

    if(!utils.dateIsSame(oldData.deadlineTime, newData.deadlineTime)) {
        changeLog.push(`New deadline time: from ${utils.to_HHmm(oldData.deadlineTime)} to ${utils.to_HHmm(newData.deadlineTime)}`);
    }

    if(oldData.duration !== newData.duration) {
        changeLog.push(`New duration: from ${oldData.duration} to ${newData.duration}`);
    }

    if(oldData.comments !== newData.comments) {
        changeLog.push(`Comments update: from ${oldData.comments} to ${newData.comments}`);
    }

    if(oldData.comments !== newData.comments) {
        changeLog.push(`Description update: from ${oldData.description} to ${newData.description}`);
    }
    
    return changeLog;
}