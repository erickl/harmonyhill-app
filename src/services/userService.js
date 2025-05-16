import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import * as userDao from "../daos/userDao.js";

export async function signUp(username, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const success = await userDao.add(user.uid, {
            name: username,
            email: email,
            role: "staff",
            createdAt: new Date(),
            lastLoginAt: null,
            approved: false,
        });

        await updateProfile(user, {
            displayName: username,
        });

        return true;
    } catch (error) {
        console.error("Error signing up: ", error);
        return false;
    }
}
  
export async function login(email, password) {
    try {
        const isApproved = await isApproved(email);
        if(!isApproved) {
            console.error("User is not approved");
            return false;
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
    
        const success = await userDao.updateLastLoggedIn(user.uid);
        return success;
    } catch (error) {
        console.error("Error logging in: ", error);
        return false;
    }
}

async function logout() {
    await signOut(auth);
}

export function getUser() {
    const user = auth.currentUser;
    return user ? user : null;
}

export function getUserName() {
    const user = getUser();
    return user && user.displayName ? user.displayName : "unknown";
}

export async function isAdmin() {
    const user = getUser();
    if (!user) {
        return false;
    }
    
    const userData = await userDao.getOne(user.uid);
    if (!userData) {
        return false;
    }
    return userData.role === "admin";
}

export async function isApproved(email) {
    const users = await userDao.get({email: email});
    if (!users || users.length === 0) {
        return false;
    }
    const user = users[0];
    return user.approved;
}
