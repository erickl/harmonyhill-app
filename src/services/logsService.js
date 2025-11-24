import * as logsDao from "../daos/logsDao.js";
import {commitTx, decideCommit} from "../daos/dao.js";

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

export async function remove(id, onError, writes = []) {
    const commit = decideCommit(writes);

    const result = await logsDao.remove(id, onError, writes);
    if(result === false) return false;

    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}
