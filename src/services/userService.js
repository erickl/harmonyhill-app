import { getAuth } from "firebase/auth";

export function getUser() {
    const auth = getAuth();
    const user = auth.currentUser;
    return user ? user : null;
}

export function getUserName() {
    const user = getUser();
    return user ? user.displayName : "unknown";
}

export function isAdmin() {
    const user = getUser();
    return user ? user.displayName === "admin" : false;
}