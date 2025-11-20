import * as dao from './dao.js';
import { where, orderBy } from 'firebase/firestore';
import * as utils from "../utils.js";

export async function getOne(userId) {
    try {
        const user = await dao.getOne(['users'], userId);
        return user;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return null;
    }
}

export async function get(options = {}) {
    let filters = [];
    if(utils.exists(options, "email")) { 
        filters.push(where("email", "==", options.email));
    }

    if(utils.exists(options, "username")) { 
        filters.push(where("name", "==", options.username));
    }

    try {
        const users = await dao.get(['users'], filters);
        return users;
    } catch (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
}

export async function add(id, userData, onError, writes) {
    return await dao.add(['users'], id, userData, onError, writes);
}

export async function update(id, userData, onError, writes) {
    return await dao.update(['users'], id, userData, false, onError, writes);
}

export async function updateLastLoggedIn(id, writes) {
    return await update(id, { lastLoginAt: new Date()}, writes);
}
