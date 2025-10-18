import { admin } from "../functions/admin-firebase.js";
import * as utils from "./utils.js";

export async function makeFirestoreAdapter(db) {
    const isAdmin = !!db.collectionGroup; 

    if (isAdmin) {
        const toTimestamp = (inputDate) => {
            if(utils.isEmpty(inputDate)) return null;
            const jsDate = utils.toJsDate(inputDate);
            return admin.firestore.Timestamp.fromDate(jsDate);
        }
        
        return {
            toTimestamp,

            async get(collectionName, filters = [], orderByField = null, onError = null) {
                try {
                    let query = db.collection(collectionName);
                    
                    for(let [fieldName, comparator, value] of filters) {
                        value = utils.isDate(value) ? toTimestamp(value) : value;
                        const isOfCorrectTimstampe = value instanceof admin.firestore.Timestamp
                        const ctorName = value?.constructor?.name;
                        query = query.where(fieldName, comparator, value);
                    }

                    if(orderByField) {
                        query = query.orderBy(orderByField);
                    }

                    const snapshot = await query.get();
                    if (snapshot.empty) {
                        return [];
                    }
                    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
                    return docs;
                } catch(e) {
                    if(onError) onError(`Couldn't get data from '${collectionName}': ${e.message}`);
                    return [];
                }
            },
            async getCollectionGroup(collectionName, filters = [], orderByField = null, onError = null) {
                try {
                    const collectionGroup = db.collectionGroup(collectionName);
                    let query = collectionGroup;
                    for(const [fieldName, comparator, value] of filters) {
                        value = utils.isDate(value) ? toTimestamp(value) : value;
                        query = query.where(fieldName, comparator, value);
                    }
                    if(orderByField) {
                        query = query.orderBy(orderByField);
                    }
                    const snapshot = await query.get();
                    if (snapshot.empty) {
                        return [];
                    }
                    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
                    return docs;
                } catch(e) {
                    if(onError) onError(`Couldn't get data from '${collectionName}': ${e.message}`);
                }
            }
        }
    } else {
        const { where, query, limit, collection, collectionGroup, getDocs, getDoc, setDoc, updateDoc, doc, deleteDoc, runTransaction} = await import("firebase/firestore");
        
        return {
            async get(path, filters = [], ordering = [], max = -1, onError = null) {
                try {
                    const collectionRef = collection(db, ...path);

                    let queryFilters = [];
                    for(const [fieldName, comparator, value] of filters) {
                        value = utils.isDate(value) ? utils.toFireStoreTime(value) : value;
                        queryFilters.push(where(fieldName, comparator, value));
                    }

                    let ordering_ = [];
                    for(const [fieldName, order] of ordering) {
                        ordering_.push(orderBy(fieldName, order));
                    }
                    
                    const constraints = [];
                    
                    if(queryFilters?.length > 0) constraints.push(...queryFilters);   
                    if(ordering_?.length > 0) constraints.push(...ordering_);
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
            },
            async getCollectionGroup(collectionName, filters = [], orderByField = null, onError = null) {
                try {
                    const collectionGroupRef = collectionGroup(db, collectionName);

                    let queryFilters = [];
                    for(const [fieldName, comparator, value] of filters) {
                        value = utils.isDate(value) ? utils.toFireStoreTime(value) : value;
                        queryFilters.push(where(fieldName, comparator, value));
                    }

                    const docQuery = query(collectionGroupRef, ...queryFilters, ...ordering);
                    
                    const snapshot = await getDocs(docQuery);
                    if (snapshot.empty) {
                        return [];
                    }
                    const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
                    return docs;
                } catch (e) {
                    if(onError) onError(`Error getting documents from collection ${collectionName}: `, e);
                    return [];
                }
            },
            async add(path, id, data, onError = null) {
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
        }
    }
}
