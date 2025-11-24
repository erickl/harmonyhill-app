import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser } from "firebase/auth";
import { auth } from "../firebase.js";
import * as userDao from "../daos/userDao.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit} from "../daos/dao.js";

export async function signUp(username, email, role, password, onError, writes = []) {
    const commit = decideCommit(writes);

    let addUserDataSuccess = false;

    try {
        const existingUsers = await userDao.get({email: email});
        if (existingUsers && existingUsers.length > 0) {
            console.error(`User ${email} already exists`);
            return false;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, {
            displayName: username,
        });

        const userData = {
            name: username,
            email: email,
            role: role,
            lastLoginAt: null,
            approved: false,
        };

        addUserDataSuccess = await userDao.add(user.uid, userData, onError, writes);

        if(commit) {
            if((await commitTx(writes, onError)) === false) {
                throw new Error(`Unexpected error`);
            }
        }
    } catch (e) {
        onError(`Error signing up: ${e.message}`);
    } finally {
        // If we don't log them out here, they will be logged in right after registering. We need to approve them first
        await signOut(auth);
    }

    return true;
}
  
/**
 * @param {*} username can be the username or email
 * @param {*} password 
 * @param {*} onError is a callback, called with an error message if something goes wrong
 * @returns true if log in successful, otherwise false
 */
export async function login(username, password, onError, writes = []) {
    const commit = decideCommit(writes);

    if(!utils.isString(username) || !utils.isString(password)) {
        onError(`Username or password ${username} is incorrect (1)`);
        return false;
    }
    username = username.trim();

    try {
        const isApproved = await isUserApproved(username);
        if(!isApproved) {
            onError(`Username or password is incorrect (2)`);
            return false;
        }
        
        // In case username is not the email, find the email to use email auth with firebases
        const userData = await getUser(username);
        if(!userData) {
            onError(`Username or password is incorrect (3)`);
            return false;
        }
        const email = userData.email;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
    
        const success = await userDao.updateLastLoggedIn(firebaseUser.uid, writes);
        if(success === false) return false;
     
        if(commit) {
            if((await commitTx(writes, onError)) === false) return false;
        }
     
        return success;
    } catch (error) {
        onError(`Username or password is incorrect (4)`);
        return false;
    }
}

export function isLoggedIn() {
    // user == null if not logged in
    const user = getFirebaseUser();
    if (!user) {
        return false;
    }

    return true;
}

export async function logLastActive(onError, writes = []) {
    const commit = decideCommit(writes);

    try {
        const fbUser = getFirebaseUser();
        if (!fbUser) {
            return null;
        }

        const result = await userDao.update(fbUser.uid, {"lastActiveAt": utils.toFireStoreTime(utils.now())}, onError, writes);
        if(result === false) return false;

        if(commit) {
            if((await commitTx(writes, onError)) === false) return false;
        }

        return result;
    } catch(e) {
        return false;
    }  
}

function getFirebaseUser() {
    const user = auth.currentUser;
    return user ? user : null;
}

export async function getCurrentUser() {
    const user = getFirebaseUser();
    if (!user) {
        return null;
    }

    return await userDao.getOne(user.uid);
}

export async function getUserRole() {
    const user = await getCurrentUser();
    if(!user) {
        return null;
    }
    return user.role;
}

export async function isManagerOrAdmin() {
    const role = await getUserRole();
    return !utils.isEmpty(role) && (role === "manager" || role === "admin");
}

export async function canSeeAllBookings() {
    const user = await getCurrentUser();
    if(!user) return false;
    return user.role === "admin" || user.role === "manager";
}

export async function hasEditBookingsPermissions() {
    return isAdmin();
}

export async function hasAddBookingsPermissions() {
    return isAdmin();
}

export async function logout() {
    try {
        await signOut(auth);
        return true;
    } catch(error) {
        console.log("Error logging out: ", error.message);
        return false;
    }
}

export async function getCurrentUserName() {
    const user = await getCurrentUser();
    return user && user.name ? user.name : "unknown";
}

export async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;
    return user.role === "admin";
}

export async function approve(email, writes = []) {
    const commit = decideCommit(writes);
    
    if(!isAdmin()) return false;

    const users = await userDao.get({email: email});
    if (!users || users.length === 0) {
        console.error(`User ${email} not found`);
        return false;
    }
    const user = users[0];
    const result = await userDao.update(user.id, {approved: true}, writes);
    if(result === false) return false;
    
    if(commit) {
        if((await commitTx(writes)) === false) return false;
    }

    return result;
}

async function getUser(username) {
    if(!utils.isString(username)) return null;
    username = username.trim();

    let users = await userDao.get({email: username.toLowerCase()}); // emails don't care about case
    if (!users || users.length === 0) {
        users = await userDao.get({username: username});
        if (!users || users.length === 0) {
            return null;
        }
    }
    const user = users[0];
    return user;
}

export async function getUsers() {
    const users = await userDao.get();
    return users;
}

/**
 * Check if the user is approved, by email or username
 * @param {*} username can be the username or email
 * @returns true if user approved, otherwise false
 */
export async function isUserApproved(username) {
    const user = await getUser(username);
    return user && user.approved;
}
