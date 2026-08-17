import * as issueDao from "../daos/issueDao.js";
import { commitTx, decideCommit, getPath } from "../daos/dao.js";

export async function getOne(recordId, onError) {
    const filter = {
        flaggedRecordId : recordId,
    };

    const issue = await issueDao.get(filter, onError);

    return issue;
}

// Input record could be the issue record or the flagged record (e.g. an expense)
// Make sure to get the issue record
export async function getIssue(record, onError) {
    let issue = record;
    const path = getPath(issue);
    if(path[0] !== "issues") {
        issue = await getOne(record.id, onError);
    }

    return issue;
}

export async function getComments(record, onError) {
    const issue = await getIssue(record);
    return await issueDao.getComments(issue, onError);
}

export async function add(record, comment, onError, writes = []) {
    const commit = decideCommit(writes);

    const recordPathArray = getPath(record);
    const recordPath = recordPathArray.join("/");

    const issue = {
        collection : recordPath,
        flaggedRecordId : record.id,
        status : "attention"
    };

    const addIssueResult = await issueDao.add(issue, onError, writes);
    if (addIssueResult === false) return false;

    const markResult = await issueDao.mark(record, "attention", onError, writes);
    if (markResult === false) return false;

    const commentRecord = {
        comment: comment,
        status: "attention"
    }
    const addCommentResult = await issueDao.addComment(addIssueResult, commentRecord, onError, writes)
    if (addCommentResult === false) return false;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    return addIssueResult;
}

export async function update(record, issue, status, onError, writes = []) {
    const commit = decideCommit(writes);

    const updateData = {
        status: status
    };

    const updateIssueResult = await issueDao.update(issue, updateData, onError, writes);

    const markResult = await issueDao.mark(record, "resolved", onError, writes);
    if (markResult === false) return false;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    return updateIssueResult;
}

export async function resolveIssue(record, issue, comment, onError, writes = []) {
    const commit = decideCommit(writes);

    const resolutionResult = await update(record, issue, "resolution", onError, writes);
    if (resolutionResult === false) return false;

    const commentRecord = {
        comment: comment,
        status: "resolved"
    }
    const addCommentResult = await issueDao.addComment(resolutionResult, commentRecord, onError, writes)
    if (addCommentResult === false) return false;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    return resolutionResult;
}

export async function approveIssue(record, comment, onError, writes = []) {
    const commit = decideCommit(writes);

    const approvalResult = await issueDao.add(record, "approval", comment, onError, writes);
    if (approvalResult === false) return false;

    const result = await update(record, "approved", onError, writes);
    
    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function get(collectionName, filter = {}, onError) {
    return await issueDao.getFromCollection(collectionName, filter, onError);
}

export async function getLastIssue(record, onError) {
    return await issueDao.getLast(record, onError);
}