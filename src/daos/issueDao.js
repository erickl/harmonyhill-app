import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

const path = ["issues"];

export async function add(issue, onError, writes) {
    const id = `issue-${Date.now()}`;
    return await dao.add(path, id, issue, onError, writes);
}

export async function addComment(issue, comment, onError, writes) {
    const commentPath = [...path, issue.id, "comments"];
    const id = `issue-comment-${Date.now()}`;
    return await dao.add(commentPath, id, comment, onError, writes);
}

export async function getComments(issue, onError, writes) {
    const commentsPath = [...path, issue.id, "comments"];
    return await dao.get(commentsPath, [], -1, onError);
}

export async function mark(record, type, onError, writes) {
    const path = dao.getPath(record);
    return await dao.update(path, record.id, {issue: "attention"}, true, onError, writes);
}

export async function update(issue, updateData, onError, writes) {
    const path = dao.getPath(issue);
    return await dao.update(path, issue.id, updateData, true, onError, writes);
}

export async function get(filter, onError) {
    const queries = [];

    if(utils.exists(filter, "flaggedRecordId")) {
        queries.push(where("flaggedRecordId", "==", filter.flaggedRecordId));
    }

    const issues = await dao.get(path, queries, [], -1, onError);
    if(issues.length === 1) return issues[0];

    return issues;
}

export async function getFromCollection(collectionName, filter, onError) {
    const queries = [where("issue", "==", "attention")];
    const order = [orderBy("createdAt", "asc")];

    return await dao.get(collectionName, queries, order, -1, onError);
}

export async function getLast(record, onError) {
    const path = dao.getPath(record);
    path.push(record.id, "issues");
    const order = [orderBy("createdAt", "desc")];
    const issues = await dao.get(path, {}, order, 1, onError);
    if(issues.length === 0) return null;
    return issues[0];
}
