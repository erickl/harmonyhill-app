import * as logsDao from "../daos/logsDao.js";

export async function get(filters, onError) {
    const logs = await logsDao.get(filters, onError);
    return logs;
}

export async function getDocument(path, onError) {
    const pathArray = path.split("/");
    const id = pathArray.pop();
    const document = await logsDao.getDocument(pathArray, id, onError);
    return document;
}

export async function remove(id, onError) {
    return await logsDao.remove(id, onError);
}
