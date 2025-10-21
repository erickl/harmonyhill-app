import { 
    where, 
    query, 
    limit,
    collection, collectionGroup,  
    getDocs, getDoc, 
    setDoc, updateDoc, 
    doc, 
    deleteDoc,
    runTransaction
} from 'firebase/firestore';
import { db, auth } from "../firebase.js";
import * as constant from "./daoConst.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import { DateTime } from 'luxon';

export { constant }

export async function getOne(path, id, onError = null) {
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
        if(onError) onError(`Error getting one document ${path}/${id}: ${e.message}`);
        return null;
    }
}

export async function get(path, filters = [], ordering = [], max = -1, onError = null) {
    try {
        const collectionRef = collection(db, ...path);
        
        const constraints = [];
        
        if(filters?.length > 0)  constraints.push(...filters);   
        if(ordering?.length > 0) constraints.push(...ordering);
        if(max !== -1)           constraints.push(limit(max))
        
        const docQuery = query(collectionRef, ...constraints);
        const snapshot = await getDocs(docQuery);
        if (snapshot.empty) {
            return [];
        }
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
        return docs
    } catch (e) {
        if(onError) onError(`Error getting documents from ${path}: ${e.message}`);
        return []; 
    }
}

// if startingAt is empty in db, the orderBy() call leaves the objects in db (i.e) not fetching them. So do the sorting ourselves
// let ordering = [ orderBy("startingAt", "asc") ];
export function sort(unsorted, fieldName, order = "asc") {
    order = order.toLowerCase();
    try {
        const sorted = unsorted.sort((a, b) => {
            const aVal = a[fieldName];
            const bVal = b[fieldName];
            
            const aIsNull = utils.isEmpty(aVal)
            const bIsNull = utils.isEmpty(bVal)
            
            if (aIsNull && bIsNull) return 0;
            if (aIsNull) return 1; // a goes after b
            if (bIsNull) return -1; // b goes after a
            
            return order == "asc" ? aVal - bVal : bVal - aVal;
        });
        return sorted;
    } catch(e) {
        return false; // todo: message the user somehow
    }
}

export async function getOneFromSubCollection(collectionName, id, onError = null) {
    try {
        const q = query(
            collectionGroup(db, collectionName),
            where("__name__", "==", id),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
        return docs[0];
    } catch(e) {
        if(onError) onError(`Error getting ${id} from ${collectionName}: ${e.message}`);
        return null;
    }
}

export async function getSubCollections(collectionName, filters = [], ordering = [], onError = null) {
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
        if(onError) onError(`Error getting documents from collection ${collectionName}: `, e);
        return [];
    }
}

// export async function getOneFromSubCollections(collectionName, id, onError) {
//     try {
//         const collectionGroupQuery = collectionGroup(db, collectionName);
//         const queryFilter =  where('__name__', '==', id); // __name__ needs full path. YOu may be able to search on a field name though
//         const q = query(collectionGroupQuery, queryFilter);
//         const querySnapshot = await getDocs(q);
//         const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
//         //querySnapshot.forEach((doc) => {console.log(doc.id, doc.data());});
//         return docs;
//     } catch(e) {
//         if(onError) onError(`Error fetching ${id} from ${collectionName}: ${e.message}`);
//         return false;
//     }
// }

/**
 * Creates and includes a change logs string in the new booking object.
 * Cannot update createdAt or createdBy
 */
export async function update(path, id, updatedData, updateLogs, onError = null) { 
    try {
        const originalData = await getOne(path, id);

        if(!originalData) {
            throw new Error(`Document ${path}/${id} doesn't exist. Can't be updated`);
        }

        const currentUsername = await getCurrentUsername();
        const now = new Date();

        // Remove any field which should not be updated
        if(utils.exists(updatedData, "createdAt")) {
            delete updatedData.createdAt;
        }
        if(utils.exists(updatedData, "createdBy")) {
            delete updatedData.createdBy;
        }

        if(utils.exists(updatedData, "id")) {
            delete updatedData.id;
        }
        if(utils.exists(updatedData, "ref")) {
            delete updatedData.ref;
        }

        // Add change to the update logs
        let diffStr = "";
        if(updateLogs) {
            diffStr = await jsonObjectDiffStr(originalData, updatedData);
        
            // todo: should the user be notified whether or not the update wasn't necessary?
            if(diffStr.length === 0) {
                //if(onError) onError(`Update error: No changes to update to ${path}/${id}`);
                return true;
            }
                
            updatedData.updateLogs = utils.exists(originalData, "updateLogs") ? originalData.updateLogs : [];
            updatedData.updateLogs.push(diffStr);

            // Log user activity
            const updateLog = {
                "document"  : `${path.join("/")}/${id}`,
                "edit"      : diffStr,
                "createdBy" : currentUsername,
                "createdAt" : now,
                "action"    : "update" 
            };
            const updateLogRef = doc(db, ...["userLogs"], `u-${id}-${Date.now()}`);
            const updateLogResult = await setDoc(updateLogRef, updateLog);
        }

        updatedData.updatedAt = now;
        updatedData.updatedBy = currentUsername;

        // Run the main update
        const ref = doc(db, ...path, id);
        const updateResult = await updateDoc(ref, updatedData);
        return true;
    }
    catch (e) {
        if(onError) onError(`Error updating document ${path}/${id}: ${e.message}`);
        return false;
    }
}

async function getCurrentUsername() {
    const user = await getOne(['users'], auth.currentUser.uid);
    return user ? user.name : null;
}

export async function add(path, id, data, onError = null) {
    try {
        data.createdAt = new Date();
        data.createdBy = await getCurrentUsername();

        // Log user activity
        const addLog = {
            "document"  : `${path.join("/")}/${id}`,
            "createdBy" : data.createdBy,
            "createdAt" : data.createdAt,
            "action"    : "create" 
        };
        const addLogRef = doc(db, ...["userLogs"], `c-${id}`);
        const addLogResult = await setDoc(addLogRef, addLog);
        
        // Create the data record in DB
        const ref = doc(db, ...path, id);
        const addResult = await setDoc(ref, data);
        return true;
    } catch (e) {
        if(onError) onError(`Error adding document ${path}/${id}: ${e.message}`);
        return false;
    }
}

export async function remove(path, id, onError = null) {
    try {
        const docIdToDelete = `${path.join("/")}/${id}`;

        // Log the deleted data before deleting it
        let dataToDelete = await getOne(path, id);
        if (!dataToDelete) {
            if(onError) onError(`Document ${docIdToDelete} could not be deleted because it was not found`);
            return false;
        }

        dataToDelete.deletedBy = await getCurrentUsername();
        dataToDelete.deletedAt = new Date();
        dataToDelete.deletedFrom = docIdToDelete;

        // Log user activity
        const delLog = {
            "document"  : dataToDelete.deletedFrom,
            "createdBy" : dataToDelete.deletedBy,
            "createdAt" : dataToDelete.deletedAt,
            "action"    : "delete" 
        };
        const delLogRef = doc(db, ...["userLogs"], `d-${id}`);
        const delLogResult = await setDoc(delLogRef, delLog);
        
        // Store deleted document in separate collection as safety measure
        const deletedRef = await add(["deleted"], `d-${id}`, dataToDelete);
        
        // Delete document
        const ref = doc(db, ...path, id);
        const deleteResult = await deleteDoc(ref);
        console.log(`Deleted document ${path}/${id}`);
        return true;
    } catch (e) {
        if(onError) onError(`Error deleting document ${path}/${id}: ${e.message}`);
        return false;
    }
}

export async function getParent(child) {
    const childDocRef = child.ref;
    const childCollectionRef = childDocRef.parent;
    const parentDocRef = childCollectionRef.parent;

    if (parentDocRef) {
        const parentSnap = await getDoc(parentDocRef);
        if (parentSnap.exists()) {
            let parentData = parentSnap.data();
            parentData.id = parentSnap.id;
            parentData.ref = parentSnap.ref;
            return parentData;
        }
    }
    return null;
}

export async function transaction(inTransaction) {
    try {
        const transactionResult = await runTransaction(db, inTransaction);
        return true;
    } catch (e) {
        console.error(`Error in DB transaction`, e);
        return false;
    }
}

export async function jsonObjectDiffStr(obj1, obj2) {
    let diff = "";
    
    try {
        if(utils.isEmpty(obj1)) {
            throw new Error("Original object was null");
        }
        if(utils.isEmpty(obj2)) {
            throw new Error("New object was null");
        }

        for (const key in obj2) {
            try {
                if(key === "updatedBy") continue;
                if(key === "updatedAt") continue;
                if(key === "createdBy") continue;
                if(key === "createdAt") continue;

                const val1 = obj1[key];
                const val2 = obj2[key];

                if(utils.isEmpty(val1) && utils.isEmpty(val2)) {
                    continue;
                }
                else if (utils.isEmpty(val1)) {
                    // Display human readable data
                    const val2Legible = utils.isDate(val2) ? utils.toDateTime(val2) : val2; 
                    diff += `Added ${key}: ${val2Legible}, `;
                } 
                else if(utils.isDate(val2)) {
                    const val1DateTime = utils.toDateTime(val1);
                    const val2DateTime = utils.toDateTime(val2);
                    if(!val1DateTime.equals(val2DateTime)) {
                        diff += ` ${key}: ${val1DateTime} -> ${val2DateTime}, `;
                    }
                }
                else if (val2 !== val1) {
                    const val2_ = utils.isEmpty(val2) ? "[empty]" : val2;
                    diff += ` ${key}: ${val1} -> ${val2_}, `;
                }
            } catch(e) {
                diff += `Failed comparing field ${key}: ${e.message}, `;
            }
        }

        // add prefix with user info & remove the last comma and space
        if (diff.length > 0) {
            const username = await userService.getCurrentUserName();
            const nowStr = utils.to_yyMMddHHmmTz(DateTime.now());
            diff = `Updated by ${username} at ${nowStr}: ${diff}`;
            diff = diff.slice(0, -2);
        }
    } catch(e) {
        diff += `Unexpected error in update comparison: ${e.message}`;
    }

    return diff;
}
