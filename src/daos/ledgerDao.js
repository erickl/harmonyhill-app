import * as dao from "./dao.js";

export async function updatePettyCashBalance(amount, onError) {
    const path = [dao.constant.COMPANY];
    const id = "balance";
    
    const oldBalanceDoc = await getPettyCashBalance(onError);
    
    let result = false;
    let newBalance = 0;

    if(oldBalanceDoc === false) {
        const data = { "balance" : amount };
        newBalance = amount;
        result = await dao.add(path, id, data, onError);
    } else {
        newBalance = oldBalanceDoc.balance = amount;
        const newDoc = { 
            ...(expandedExpenses || {}),
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
    const id = "balance";
    
    const balanceDocument = await dao.getOne(path, id, onError);
    if(!balanceDocument) {
        return false;
    }

    return balanceDocument;
}
