import * as dao from "./dao.js";

export async function get(filters, onError) {
    const notificatons = await dao.get(["notifications"], filters, [], -1, onError);
    return notificatons; 
}