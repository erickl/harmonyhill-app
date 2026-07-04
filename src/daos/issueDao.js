import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

export async function add(record, comment, onError, writes) {
    const path = dao.getPath(record);
    path.push(record.id, "issues");
    const id = `issue-${Date.now()}`;
    return await dao.add(path, id, {comment:comment}, onError, writes);
}

export async function mark(record, type, onError, writes) {
    const path = dao.getPath(record);
    return await dao.update(path, record.id, {issue: "attention"}, true, onError, writes);
}

export async function update(issue, updateData, onError, writes) {
    const path = dao.getPath(issue);
    return await dao.update(path, issue.id, updateData, true, onError, writes);
}

export async function get(collectionName, filter, onError) {
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
