import * as logsDao from "../daos/logsDao.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit, getOne} from "../daos/dao.js";
import {getOne as getActivity} from "./activityService.js";
import {getOne as getBooking} from "./bookingService.js";

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

export async function getDeleted(id, onError) {
    const docs = await logsDao.getDeleted(id, onError);
    if(docs.length === 0) return null;
    return docs[0];
}

export async function toArrays(filters, onProgress, onError) {
    const documents = await get(filters, onError);

    const headers = [
        "createdAt",
        "action",
        "createdBy",
        "document",
    ];

    let rows = [headers];

    const result = await Promise.all(documents.map(async (document) => {
        let values = [];
        for(const header of headers) {
            if(header === "document") {
                const docPathAndId = document[header];
                const lastSlash = docPathAndId.lastIndexOf('/');
                const path = docPathAndId.slice(0, lastSlash);  
                const id = docPathAndId.slice(lastSlash + 1); 
                let doc = null;
                let activity
                if(document.action === "delete") {
                    doc = await getDeleted(docPathAndId, onError);
                    if(doc && doc.category === "guest expenses") {
                        const booking = await getBooking(doc.bookingId);
                        activity = await getActivity(booking, doc.activityId);
                    }
                } else {
                    doc = await getOne(path, id, onError);
                }

                delete doc["ref"];
                 
                values.push(path);
                values.push(id);
                if(doc) {
                    values.push("DOCUMENT --> ");
                    Object.entries(doc).forEach(([key, val]) => values.push(`${key}: ${val}`));
                }
                if(activity) {
                    values.push("ACTIVITY --> ");
                    Object.entries(activity).forEach(([key, val]) => values.push(`${key}: ${val}`));
                }
            } else {
                values.push((utils.exists(document, header) ? document[header] : "-"));
            }
            //onProgress((i/documents.length)*100);
        }

        return values;
    }));

    onProgress(100);
    result.unshift(headers);
    return result;
}