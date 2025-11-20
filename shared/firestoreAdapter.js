
import * as utils from "./utils.js";

function makeActivityId(activity) { 
    const houseShort = activity.house.trim().toLowerCase() === "harmony hill" ? "hh" : "jn";
    const startingAt = utils.to_YYMMdd(activity.startingAt);
    const subCategory = activity.subCategory.trim().toLowerCase().replace(/ /g, '-');
    return `${startingAt}-${houseShort}-${subCategory}-${Date.now()}`;
}

export async function makeFirestoreAdapter(db, adminTimestamp = null) {
    const isAdmin = !!db.collectionGroup; 

    let adapter = {};

    if (isAdmin && adminTimestamp) {
        const toTimestamp = (inputDate) => {
            if(utils.isEmpty(inputDate)) return null;
            const jsDate = utils.toJsDate(inputDate);
            return adminTimestamp.fromDate(jsDate);
        }
        
        adapter = {
            toTimestamp,

            async get(collectionName, filters = [], orderByField = null) {
                try {
                    let query = db.collection(collectionName);
                    
                    for(let [fieldName, comparator, value] of filters) {
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
                    console.log(`Couldn't get data from '${collectionName}': ${e.message}`);
                    return [];
                }
            },
            
            async getCollectionGroup(collectionName, filters = [], orderByField = null) {
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
                    console.log(`Couldn't get data from '${collectionName}': ${e.message}`);
                    return [];
                }
            },

            async getOne(path, id) {
                try {
                    const docRef = db.collection(path).doc(id);
                    const docSnapshot = await docRef.get();
                    if (!docSnapshot.exists) return null;
                    return { ...snapshot.data(), id: snapshot.id, ref: snapshot.ref };
                } catch(e) {
                    console.log(`Error getting one document ${path}/${id}: ${e.message}`);
                    return null;
                }
            },

            async add(path, id, data) {
                try {
                    for(const [key, value] of Object.entries(data)) {
                        if(utils.isDate(value)) {
                            data[key] = toTimestamp(value);
                        }
                    }
                    const pathString = Array.isArray(path) ? path.join('/') : path;
                    const docRef = db.collection(pathString).doc(id);
                    await docRef.set(data);
                    return true;
                } catch(e) {
                    console.log(`Error adding document ${path}/${id}: ${e.message}`);
                    return false;
                }
            }
        }
    } else {
        const { where, query, limit, collection, collectionGroup, getDocs, getDoc, setDoc, updateDoc, doc, deleteDoc, runTransaction} = await import("firebase/firestore");
        const {auth} = await import("../src/firebase.js");
        const { Timestamp } = await import("firebase/firestore");

        const toTimestamp = (value) => {
            if(!utils.isDate(value)) return null;
            const jsDate = utils.toJsDate(value);
            return Timestamp.fromDate(jsDate);
        }
        
        adapter = {
            toTimestamp,
            async get(path, filters = [], ordering = [], max = -1, onError = null) {
                try {
                    const collectionRef = collection(db, ...path);

                    let queryFilters = [];
                    for(const [fieldName, comparator, value] of filters) {
                        value = utils.isDate(value) ? toTimestamp(value) : value;
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
                        value = utils.isDate(value) ? toTimestamp(value) : value;
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

            async getOne(path, id, onError = null) {
                try {
                    const docRef = doc(db, ...path, id);
                    const snapshot = await getDoc(docRef);
                    if(!snapshot.exists()) return null;
                    return { ...snapshot.data(), id: snapshot.id, ref: snapshot.ref };  
                } catch (e) {
                    if(onError) onError(`Error getting one document ${path}/${id}: ${e.message}`);
                    return null;
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
        };
    }

    adapter["makeActivityId"] =  makeActivityId;

    return adapter;
}
