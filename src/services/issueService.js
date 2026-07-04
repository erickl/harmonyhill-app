import * as issueDao from "../daos/issueDao.js";
import { commitTx, decideCommit } from "../daos/dao.js";

export async function flagIssue(record, comment, onError, writes = []) {
    const commit = decideCommit(writes);

    const flagResult = await issueDao.add(record, comment, onError, writes);
    if (flagResult === false) return false;

    const markResult = await issueDao.mark(record, "attention", onError, writes);
    if (markResult === false) return false;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }

    return flagResult;
}

export async function updateIssueStatus(record, status, onError, writes = []) {
    const commit = decideCommit(writes);

    // todo: Update issue?
    //const lastIssue = await issueDao.getLast(record, onError);
    //if (lastIssue === false) return false;

    const markResult = await issueDao.mark(record, "resolved", onError, writes);
    if (markResult === false) return false;

    if (commit) {
        if ((await commitTx(writes, onError)) === false) return false;
    }
}

export async function resolveIssue(record, onError, writes = []) {
    return await updateIssueStatus(record, "resolved", onError, writes);
}

export async function approveIssue(record, onError, writes = []) {
    return await updateIssueStatus(record, "approved", onError, writes);
}

export async function get(collectionName, filter = {}, onError) {
    return await issueDao.get(collectionName, filter, onError);
}

export async function getLastIssue(record, onError) {
    return await issueDao.getLast(record, onError);
}