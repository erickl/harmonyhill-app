import * as dao from "./dao.js";

export async function updatePettyCashBalance(amount, onError) {
    const path = [dao.constant.COMPANY];
    const id = "petty-cash";
    
    const existing = await getPettyCashBalance(onError);
    
    let result = false;
    let newBalance = 0;

    if(existing === false) {
        const data = { "balance" : amount };
        newBalance = amount;
        result = await dao.add(path, id, data, onError);
    } else {
        newBalance = existing.balance + amount;
        const newDoc = { 
            ...(existing || {}),
            "balance" : newBalance
        };
        result = await dao.update(path, id, newDoc, false, onError);
    }

    if(result) {
        return newBalance;
    } else {
        return false;
    }
}

export async function getPettyCashBalance(onError) {
    const path = [dao.constant.COMPANY];
    const id = "petty-cash";
    
    const balanceDocument = await dao.getOne(path, id, onError);
    if(!balanceDocument) {
        return false;
    }

    return balanceDocument;
}
