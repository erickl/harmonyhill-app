import { 
    where, 
    query, 
    collection, collectionGroup,  
    getDocs, getDoc, 
    setDoc, updateDoc, 
    doc, 
    deleteDoc,
    runTransaction
} from 'firebase/firestore';
import { db } from "../firebase.js";
import * as constant from "./daoConst.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";

export { constant }

export async function getOne(path, id) {
    try {
        const docRef = doc(db, ...path, id);
        const snapshot = await getDoc(docRef);
        if(snapshot.exists()) {
            let data = snapshot.data();
            data.id = snapshot.id;
            data.ref = snapshot.ref;
            return data;
        }
        return null;
    } catch (e) {
        console.error(`Error getting one document ${path}/${id}: `, e);
        return null;
    }
}

export async function get(path, filters = [], ordering = []) {
    try {
        const collectionRef = collection(db, ...path);
        const docQuery = query(collectionRef, ...filters, ...ordering);
        const snapshot = await getDocs(docQuery);
        if (snapshot.empty) {
            return [];
        }
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
        return docs
    } catch (e) {
        throw new Error(`Error getting documents from ${path}: `, e);
    }
}

export async function getSubCollections(collectionName, filters = [], ordering = []) {
    try {
        const collectionGroupRef = collectionGroup(db, collectionName);
        const docQuery = query(collectionGroupRef, ...filters, ...ordering);
        
        const snapshot = await getDocs(docQuery);
        if (snapshot.empty) {
            //console.log(`No documents found in ${collectionName}`);
            return [];
        }
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
        return docs;
    } catch (e) {
        throw new Error(`Error getting documents from collection ${collectionName}: `, e);
    }
}

/**
 * Creates and includes a change logs string in the new booking object.
 * Cannot update createdAt or createdBy
 */
export async function update(path, id, updatedData, updateLogs, onError = null) { 
    try {
        // Remove any field which should not be updated
        if(Object.hasOwn(updatedData, "createdAt")) {
            delete updatedData.createdAt;
        }
        if(Object.hasOwn(updatedData, "createdBy")) {
            delete updatedData.createdBy;
        }

        if(updateLogs) {
            // Add change to the update logs
            const originalData = await getOne(path, id);
            let diffStr = await utils.jsonObjectDiffStr(originalData, updatedData);
        
            if(diffStr.length === 0) {
                if(onError) onError(`No changes to update to ${path}/${id}`);
                return false;
            }
                
            updatedData.updateLogs = Object.hasOwn(originalData, "updateLogs") ? originalData.updateLogs : [];
            updatedData.updateLogs.push(diffStr);
        }

        // Run the update
        const ref = doc(db, ...path, id);
        await updateDoc(ref, updatedData);
        return true;
    }
    catch (e) {
        if(onError) onError(`No changes to update to ${path}/${id}`);
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
        // Log the deleted data before deleting it
        let dataToDelete = await getOne(path, id);
        if (!dataToDelete) {
            console.log(`Document ${path}/${id} could not be deleted because it was not found`);
            return false;
        }
        
        dataToDelete.deletedBy = userService.getUserName();
        dataToDelete.deletedAt = new Date();
        dataToDelete.deletedFrom = `${path}/${id}`;
        const deletedRef = await add(["deleted"], `del-${id}`, dataToDelete);
        
        // Proceed with deleting
        const ref = doc(db, ...path, id);
        await deleteDoc(ref);
        console.log(`Deleted document ${path}/${id}`);
        return true;
    } catch (e) {
        console.error(`Error deleting document ${path}/${id}: `, e);
        return false;
    }
}

// export async function transaction(path, id, data) {
//     try {
//         const ref = doc(db, ...path, id);
//         await runTransaction(db, async (transaction) => {
//             const doc = await transaction.get(ref);
//             if (!doc.exists()) {
//                 throw new Error("Document does not exist!");
//             }
//             transaction.update(ref, data);
//         });
//         return true;
//     } catch (e) {
//         console.error(`Error in transaction ${path}/${id}: `, e);
//         return false;
//     }
// }

export async function transaction(inTransaction) {
    try {
        await runTransaction(db, inTransaction);
        return true;
    } catch (e) {
        console.error(`Error in DB transaction`, e);
        return false;
    }
}