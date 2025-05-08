import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from "../firebase.js";

export async function add(guest) {
    try {
        const guestRef = await addDoc(collection(db, "guests"), guest);
        //console.log("Document written with ID: ", guestRef.id);
        return guestRef;
    } catch (e) {
        console.error("Error adding document: ", e);
    }
    return "";
}

export async function get() {
    const guests = await getDocs(collection(db, "guests"));
    //guests.forEach((g) => { console.log(`DAO: ${g.id} =>`, g.data()); });
    return guests;
}

export async function update(guestId, guestUpdate) {
    const guestRef = doc(db, "guests", guestId);
    await updateDoc(guestRef, guestUpdate);
    return guestRef;
}
