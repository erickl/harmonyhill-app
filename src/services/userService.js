import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser } from "firebase/auth";
import { auth } from "../firebase.js";
import * as userDao from "../daos/userDao.js";
import * as utils from "../utils.js";

export async function signUp(username, email, role, password, onError) {
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

        // If we don't log them out here, they will be logged in right after registering. We need to approve them first
        await signOut(auth);

        const addUserDataSuccess = await userDao.add(user.uid, {
            name: username,
            email: email,
            role: role,
            createdAt: new Date(),
            lastLoginAt: null,
            approved: false,
        });

        if (!addUserDataSuccess) {
            console.error("Error adding user to database");
            return false;
        }

        return true;
    } catch (error) {
        onError(`Error signing up: ${error.message}`);
        return false;
    }
}
  
/**
 * @param {*} username can be the username or email
 * @param {*} password 
 * @param {*} onError is a callback, called with an error message if something goes wrong
 * @returns true if log in successful, otherwise false
 */
export async function login(username, password, onError) {
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
            onError(`Username or password is is incorrect (3)`);
            return false;
        }
        const email = userData.email;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
    
        const success = await userDao.updateLastLoggedIn(firebaseUser.uid);
        return success;
    } catch (error) {
        onError(`Error logging in: ${error.message}`);
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

export async function hasEditPermissions() {
    const user = await getCurrentUser();
    if(!user) return false;
    return user.role == "admin" || user.role == "manager";
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
    const user = getCurrentUser();
    if (!user) {
        return false;
    }
    
    return user.role === "admin";
}

export async function approve(email) {
    if(isAdmin()) {
        const users = await userDao.get({email: email});
        if (!users || users.length === 0) {
            console.error(`User ${email} not found`);
            return false;
        }
        const user = users[0];
        const success = await userDao.update(user.id, {approved: true});
        return success;
    }
    
    return false;
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

export async function testLogin() {
    const email = process.env.REACT_APP_TEST_USER_EMAIL;
    const password = process.env.REACT_APP_TEST_USER_PASSWORD;

    const signUpSuccess = await signUp("Eric Klaesson", email, "admin", password);

    const isApproved = await isUserApproved(email);
    if(!isApproved) {
        const approveSuccess = await approve(email);
    }
    
    const isLoggedIn1 = await isLoggedIn();
    if(isLoggedIn1) {
        await logout();
    }

    const signInSuccess = await login(email, password);

    const isLoggedIn2 = await isLoggedIn();

    try {
        const user = auth.currentUser
        //await deleteUser(user);
        console.log('Current user deleted successfully.');
    } catch (error) {
        console.error('Error deleting current user:', error);
    }
}
