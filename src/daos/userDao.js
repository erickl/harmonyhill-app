import * as dao from './dao.js';
import { where, orderBy } from 'firebase/firestore';

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
    if(Object.hasOwn(options, "email")) { 
        filters.push(where("email", "==", options.email));
    }

    try {
        const users = await dao.get(['users'], filters);
        return users;
    } catch (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
}

export async function add(id, userData) {
    try {
        const success = await dao.add(['users'], id, userData);
        return success;
    } catch (error) {
        console.error('Error adding user:', error);
        return null;
    }
}

export async function updateLastLoggedIn(id) {
    try {
        const success = await dao.update(['users'], id, { lastLoginAt: new Date()}, false);
        return success;
    } catch (error) {
        console.error('Error updating last login:', error);
        return false;
    }
}
