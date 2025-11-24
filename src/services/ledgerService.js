import * as ledgerDao from "../daos/ledgerDao.js";
import * as incomeService from "./incomeService.js";
import * as expenseService from "./expenseService.js";
import * as utils from "../utils.js";
import {commitTx, decideCommit} from "../daos/dao.js";

export async function getTotalIncomes(filter, onError) {
    if(Object.hasOwn(filter, "monthInt")) {
        const range = utils.monthRange(filter["monthInt"]);
        filter = { ...range, ...filter};
    }
    const entries = await incomeService.get(filter, onError);
    const sum = entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    return {
        sum : sum,
        list : entries,
    };
}

export async function getTotalExpenses(filter, onError) {
    if(Object.hasOwn(filter, "monthInt")) {
        const range = utils.monthRange(filter["monthInt"]);
        filter = { ...range, ...filter};
    }
    const entries = await expenseService.get(filter, onError);
    const sum = entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    return {
        sum : sum,
        list : entries,
    };
}

export async function getCurrentTotalExpenses(filter, onError) {
    const lastClosedPettyCashAmount = await ledgerDao.getLastClosedPettyCashRecord(onError);
    if(lastClosedPettyCashAmount === false) {
        return false;
    }
    const lastClosedAt = lastClosedPettyCashAmount.closedAt;
    
    filter["after"] = lastClosedAt;
    const expenses = await expenseService.get(filter, onError);
    const expenseSum = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return expenseSum;
}

/**
 * Get total company income since the last closed financial date, excluding petty cash top ups
 * @param {*} onError 
 * @returns 
 */
export async function getCurrentTotalIncomes(onError) {
    const lastClosedPettyCashAmount = await ledgerDao.getLastClosedPettyCashRecord(onError);
    if(lastClosedPettyCashAmount === false) {
        return false;
    }
    
    const ledgerFilter = { "after" : lastClosedPettyCashAmount.closedAt };
    const incomes = await incomeService.get(ledgerFilter, onError);
    const filteredIncomes = incomes.filter((income) => income.category !== "petty cash top up");
    const incomeSum = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
    return incomeSum;
}

/**
 * 
 * @param {*} untilDate calculate petty cash until this date. Can be set to null, in which case the cash is counted up until now
 * @param {*} onError 
 * @returns total petty cash on the given date
 */
export async function getPettyCashBalance(untilDate, onError) {
    const lastClosedPettyCashAmount = await ledgerDao.getLastClosedPettyCashRecord(onError);
    if(lastClosedPettyCashAmount === false) {
        return false;
    }
    const lastClosedAt = lastClosedPettyCashAmount.closedAt;
    
    const ledgerFilter = {
        "paymentMethod" : "cash",
        "after"         : lastClosedAt,
    };

    if(!utils.isEmpty(untilDate)) {
        ledgerFilter["before"] = untilDate;
    }

    const incomes = await incomeService.get(ledgerFilter, onError);
    const incomeSum = incomes.reduce((sum, income) => sum + income.amount, 0);

    const expenses = await expenseService.get(ledgerFilter, onError);
    const expenseSum = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const total = lastClosedPettyCashAmount.balance + incomeSum - expenseSum;
    
    return total;
}

export async function closeMonth(onError, writes = []) {
    const commit = decideCommit(writes);

    const monthEnd = utils.monthStart().plus({seconds: -1});
    const balance = await getPettyCashBalance(monthEnd, onError);
    const result = await ledgerDao.addCloseRecord(balance, onError, writes);
    if(result === false) return false;
    
    if(commit) {
        if((await commitTx(writes, onError)) === false) return false;
    }

    return result;
}

export async function getLastClosedPettyCashRecord(onError) {
    const lastClosedPettyCashRecord = await ledgerDao.getLastClosedPettyCashRecord(onError);
    if(!lastClosedPettyCashRecord) return null;
    lastClosedPettyCashRecord.closedAt = utils.toDateTime(lastClosedPettyCashRecord.closedAt);
    return lastClosedPettyCashRecord;
}
