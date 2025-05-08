import * as guestDao from "../daos/guestDao.js";

export async function get() {
    const guests = await guestDao.get();
    //guests.forEach((g) => { console.log(`From service: ${g.id} =>`, g.data());});
    return guests;
}

export async function add(guest) {
    const guestRef = await guestDao.add(guest);
    //console.log("Document written with ID: ", guestRef.id);
    return guestRef;
}

export async function update(guestId, guestUpdate) {
    const userRef = guestDao.update(guestId, guestUpdate);
    //console.log("Document updated with ID: ", userRef.id);
    return userRef;
}
