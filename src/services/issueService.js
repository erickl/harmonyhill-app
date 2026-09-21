import * as issueDao from "../daos/issueDao.js";
import { commitTx, decideCommit, getPath } from "../daos/dao.js";

export async function getOne(recordId, onError) {
    const filter = {
        flaggedRecordId : recordId,
    };

    const issue = await issueDao.get(filter, onError);
    if(Array.isArray(issue)) {
        if(issue.length > 0) return issue[0];
        else return null;
    } else {
        return issue;
    }
}

// Input record could be the issue record or the flagged record (e.g. an expense)
// Make sure to get the issue record
export async function getIssue(record, onError) {
    let issue = record;
    const path = getPath(issue);
    const mainCollectionName = path[0];
    if(mainCollectionName !== "issues") {
        issue = await getOne(record.id, onError);
    }

    return issue;
}

export async function getComments(record, onError) {
    const issue = await getIssue(record);
    if(!issue) return [];
    return await issueDao.getComments(issue, onError);
}

export async function add(record, status, comment, onError, writes = []) {
    const commit = decideCommit(writes);

    let issue = await getIssue(record, onError);
    if(!issue) {
        const recordPathArray = getPath(record);
        const recordPath = recordPathArray.join("/");

        const newIssue = {
            collection : recordPath,
            flaggedRecordId : record.id,
            status : status
        };

        issue = await issueDao.add(newIssue, onError, writes);
        if (issue === false) return false;
    } else {
        issue = await issueDao.update(issue, {status : status}, onError, writes);
        if(issue === false) return false;
    }

    const markResult = await issueDao.mark(record, status, onError, writes);
    if (markResult === false) return false;

    const commentRecord = {
        comment: comment,
        status: status
    }
    
    const addCommentResult = await issueDao.addComment(issue, commentRecord, onError, writes)
    if (addCommentResult === false) return false;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    return issue;
}

export async function resolve(record, comment, onError, writes = []) {
    return await add(record, "resolved", comment, onError, writes);
}

export async function get(collectionName, filter = {}, onError) {
    return await issueDao.getFromCollection(collectionName, filter, onError);
}

export async function getLastIssue(record, onError) {
    return await issueDao.getLast(record, onError);
}