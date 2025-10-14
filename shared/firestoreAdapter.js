export async function makeFirestoreAdapter(db) {
    const isAdmin = !!db.collectionGroup; 

    if (isAdmin) {  
        return {
            async getCollectionGroup(collectionName, filters = [], orderByField = null, onError = null) {
                try {
                    const collectionGroup = db.collectionGroup(collectionName);
                    let query = collectionGroup;
                    for(const [fieldName, comparator, value] of filters) {
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
            async getCollectionGroup(collectionName, filters) {
                try {
                    const collectionGroupRef = collectionGroup(db, collectionName);

                    let queryFilters = [];
                    for(const [fieldName, comparator, value] of filters) {
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
            }
        }
    }
}
