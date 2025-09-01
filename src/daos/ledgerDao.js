import * as dao from "./dao.js";

export async function updatePettyCashBalance(amount, onError) {
    const path = [dao.constant.COMPANY];
    const id = "balance";
    
    const oldBalanceDoc = await getPettyCashBalance(onError);
    
    let result = false;

    if(oldBalanceDoc === false) {
        const data = { "balance" : amount };
        result = await dao.add(path, id, data, onError);
    } else {
        oldBalanceDoc.balance = amount;
        result = await dao.update(path, id, oldBalanceDoc, false, onError);
    }

    if(result) {
        const newBalanceDoc = await getPettyCashBalance(onError);
        return newBalanceDoc.balance;
    } else {
        return false;
    }
}

export async function getPettyCashBalance(onError) {
    const path = [dao.constant.COMPANY];
    const id = "balance";
    
    const balanceDocument = await dao.getOne(path, id, onError);
    if(!balanceDocument) {
        return false;
    }

    return balanceDocument;
}
