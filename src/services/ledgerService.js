import * as ledgerDao from "../daos/ledgerDao.js";

export async function updatePettyCashBalance(amount, onError) {
    const newBalance = await ledgerDao.updatePettyCashBalance(amount, onError);
    if(newBalance === false) {
        return false;
    }
    return newBalance;
}

export async function getPettyCashBalance(onError) {
    const balanceDoc = await ledgerDao.getPettyCashBalance(onError);
    if(balanceDoc === false) {
        return false;
    }
    return balanceDoc.balance;
}
