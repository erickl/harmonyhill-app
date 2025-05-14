import { 
    where, 
    query, 
    collection, collectionGroup,  
    getDocs, getDoc, 
    addDoc, setDoc, updateDoc, 
    doc, 
    deleteDoc
} from 'firebase/firestore';
import { db } from "../firebase.js";
import * as constant from "./daoConst.js";

export { constant }

export async function getOne(path, id) {
    try {
        const docRef = doc(db, ...path, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? snapshot.data() : null;
    } catch (e) {
        console.error(`Error getting one document ${path}/${id}: `, e);
        return null;
    }
}

export async function get(path, filters = []) {
    try {
        const docQuery = query(collection(db, ...path), ...filters);
        const snapshot = await getDocs(docQuery);
    return snapshot.docs;
    } catch (e) {
        console.error(`Error getting documents from ${path}: `, e);
        return [];
    }
}

export async function update(path, id, updatedData) { 
    try {
        const ref = doc(db, ...path, id);
        await updateDoc(ref, updatedData);
        return true;
    }
    catch (e) {
        console.error(`Error updating document ${path}/${id}: `, e);
        return false;
    }
}

export async function add(path, id, data) {
    try {
        const ref = doc(db, ...path, id);
        await setDoc(ref, data);
        return true;
    } catch (e) {
        console.error(`Error adding document ${path}/${id}: `, e);
        return false;
    }
}

export async function remove(path, id) {
    try {
        const ref = doc(db, ...path, id);
        await deleteDoc(ref);
        console.log(`Deleted document ${path}/${id}`);
        return true;
    } catch (e) {
        console.error(`Error deleting document ${path}/${id}: `, e);
        return false;
    }
}
