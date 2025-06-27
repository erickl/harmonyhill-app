import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser } from "firebase/auth";
import { auth } from "../firebase";
import * as userDao from "../daos/userDao.js";

export async function signUp(username, email, role, password) {
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
        console.error("Error signing up: ", error);
        return false;
    }
}
  
export async function login(email, password, onError) {
    try {
        const isApproved = await isEmailApproved(email);
        if(!isApproved) {
            console.error(`User ${email} is not approved`);
            onError(`User ${email} is not approved`);
            return false;
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
    
        const success = await userDao.updateLastLoggedIn(user.uid);
        return success;
    } catch (error) {
        console.error("Error logging in: ", error);
        onError("Error logging in: ", error);
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

export async function getUser() {
    const user = getFirebaseUser();
    if (!user) {
        return null;
    }

    return await userDao.getOne(user.uid);
}

export async function hasEditPermissions() {
    const user = await getUser();
    if(!user) return false;
    return user.role == "admin" || user.role == "manager";
}

export async function logout() {
    await signOut(auth);
}

export async function getUserName() {
    const user = await getUser();
    return user && user.name ? user.name : "unknown";
}

export async function isAdmin() {
    const user = getUser();
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

export async function isEmailApproved(email) {
    const users = await userDao.get({email: email});
    if (!users || users.length === 0) {
        return false;
    }
    const user = users[0];
    return user.approved;
}

export async function testLogin() {
    const email = process.env.REACT_APP_TEST_USER_EMAIL;
    const password = process.env.REACT_APP_TEST_USER_PASSWORD;

    const signUpSuccess = await signUp("Eric Klaesson", email, "admin", password);

    const isApproved = await isEmailApproved(email);
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
