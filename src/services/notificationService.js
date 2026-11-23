import * as notificationDao from "../daos/notificationDao.js";

export async function get(filter, onError) {
    return await notificationDao.get(filter, onError); 
}
