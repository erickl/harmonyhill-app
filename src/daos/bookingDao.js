import { where, query, collection, collectionGroup, addDoc, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from "../firebase.js";

export async function add(bookingRef, booking) {
    try {
        await setDoc(doc(db, "bookings", bookingRef), booking);
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        return true;
    }
}

export async function update(bookingId, bookingUpdate) {
    const bookingRef = doc(db, "bookings", bookingId);
    try {
        await updateDoc(bookingRef, bookingUpdate);
        return true;
    }
    catch (e) {
        console.error("Error updating document: ", e);
        return false;
    }
}

export async function get(id = null) {
    let path = ["bookings"];
    if (id) {
        path.push(id);
    }
    const bookingsQuery = query(collection(db, ...path));
    const bookingsSnapshot = await getDocs(bookingsQuery);    
    return bookingsSnapshot.docs;
}

export async function filter(filterOptions) {
    let queryFilter = [];

    if (Object.hasOwn(filterOptions, "house")) {
        queryFilter.push(where("house", "==", filterOptions.house));
    }
    if (Object.hasOwn(filterOptions, "date")) {
        queryFilter.push(where("checkInDate", "<=", filterOptions.date));
        queryFilter.push(where("checkOutDate", ">=", filterOptions.date));
    }

    const bookingQuery = query(collection(db, "bookings"), ...queryFilter);
    
    const bookingsSnapshot = await getDocs(bookingQuery);
    const bookingDocuments = bookingsSnapshot.docs;
    return bookingDocuments;
}
