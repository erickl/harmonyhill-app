import * as utils from "../utils.js";
import * as dao from "../daos/dao.js";

export async function add(object, onError) {
    const inventoryItemId = makeInventoryItemId(object.name);
    const docId = makeId(object.type, inventoryItemId);
    const path = ["inventory", inventoryItemId, "stock"];
    return await dao.add(path, docId, object, onError);
}

export function makeId(type, inventoryItemId) {
    const date = utils.to_YYMMdd();
    return `stock-${inventoryItemId}-${type}-${date}-${Date.now()}`;
}

export function makeInventoryItemId(name) {
    const nameCleaned = name.trim().toLowerCase().replace(/ /g, "-");
    return `inv-${nameCleaned}`;
}
