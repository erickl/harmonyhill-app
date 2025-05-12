import { where, query, collection, collectionGroup, addDoc, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from "../firebase.js";
import { act } from 'react';

// All meals for all bookings
//const mealsQuery = query(collectionGroup(db, "activities"), where("category", "==", "meal"));

// for (const meal of mealSnapshot.docs) {
    //     //console.log(`DAO: ${meal.id} =>`, meal.data()); 
    //     const items = await getMealItems(bookingId, meal.id);
    //     let len = items.length;
    //     const item = items[0].data();
    //     const name = item.name;
    //     const price = item.price;
    // }

export async function add(bookingRef, activityRef, activity) {
    try {
        await setDoc(doc(db, "bookings", bookingRef, "activities", activityRef), activity);
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        return false;
    }
}

export async function update(bookingId, activityId, activity) {
    const activityRef = doc(db, "bookings", bookingId, "activities", activityId);
    try {
        await updateDoc(activityRef, activity);
        return true;
    } catch (e) {
        return false;
    }
}

export async function addMealItem(bookingRef, mealRef, mealItem) {
    try {
        await addDoc(collection(db, "bookings", bookingRef, "activities", mealRef), mealItem);
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        return false;
    }
}

// mealCategory = "breakfast", "lunch", "dinner", "snack", "afternoon tea", "floating breakfast"
export async function getMeals(bookingId, options = {}) {   
    if(!Object.hasOwn(options, "category")) {
        options.category = "meal";
    }

    const activities = await getActivities(bookingId, options);
    return activities;

// mealCategory = "breakfast", "lunch", "dinner", "snack", "afternoon tea", "floating breakfast"
export async function getActivities(bookingId, options = {}) {   
    if (Object.hasOwn(options, "category")) {
        filters.push(where("category", "==", options.category));
    }

    if (Object.hasOwn(options, "subCategory")) {
        filters.push(where("subCategory", "==", options.subCategory));
    }

    // ServeDate is a string in the format YYYY-MM-DD, without time
    if (Object.hasOwn(options, "serveDate")) {
        let yyyyMMdd = options.serveDate.getFullYear() + "-" + (options.serveDate.getMonth() + 1) + "-" + options.serveDate.getDate();
        filters.push(where("serveDate", "==", yyyyMMdd));
    }

    if (Object.hasOwn(options, "date")) {
        filters.push(where("serveDate", "==", options.date));
    }

    const query = query(collection(db, "bookings", bookingId, "activities"), ...filters);
    const snapshot = await getDocs(query);

    return snapshot.docs;
}

export async function getMealItems(bookingId, mealId) {
    const orderItemsQuery = query(collection(db, "bookings", bookingId, "activities", mealId, "mealItems"));
    const orderItemsSnapshot = await getDocs(orderItemsQuery);
    return orderItemsSnapshot.docs;
}

export async function get(bookingId, id = null) {
    let path = ["bookings", bookingId, "activities"];
    if (id) {
        path.push(id);
    }
    const activitiesQuery = query(collection(db, path));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    return activitiesSnapshot.docs;
}
