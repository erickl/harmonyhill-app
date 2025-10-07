import * as dao from "./dao.js";
import { where, orderBy } from 'firebase/firestore';
import * as utils from "../utils.js";

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

export async function getLastClosedPettyCashRecord(onError) {
    const path = [dao.constant.COMPANY, "petty-cash", "closed"];
    const filters = [];
    const ordering = [orderBy("closedAt", "desc")];
    const pettyCashRecords = await dao.get(path, filters, ordering, 1, onError);
    if(!pettyCashRecords || pettyCashRecords.length === 0) {
        onError(`Can't find any previous closed petty cash record. Please ask the admins to create one`);
        return false
    }
    const pettyCashRecord = pettyCashRecords[0];
    return pettyCashRecord;
}

export async function addCloseRecord(balance, onError) {
    const monthStart = utils.monthStart();
    //const previousMonth = utils.monthStart(-1);
    const previousMonth = monthStart.plus({seconds: -1});
    const previousMonthShort = previousMonth.monthShort.toLowerCase();
    const yearYY = previousMonth.year - 2000;
    const path = [dao.constant.COMPANY, "petty-cash", "closed"];
    
    const record = {
        balance : balance,
        closedAt: utils.toFireStoreTime(previousMonth),
    };

    return await dao.add(path, `closed-${previousMonthShort}-${yearYY}`, record, onError);
}
