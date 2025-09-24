import * as ledgerDao from "../daos/ledgerDao.js";
import * as incomeService from "./incomeService.js";
import * as expenseService from "./expenseService.js";
import * as utils from "../utils.js";

export async function getTotalExpenses(filter, onError) {
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
export async function getTotalIncomes(onError) {
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

export async function getPettyCashBalance(onError) {
    const lastClosedPettyCashAmount = await ledgerDao.getLastClosedPettyCashRecord(onError);
    if(lastClosedPettyCashAmount === false) {
        return false;
    }
    const lastClosedAt = lastClosedPettyCashAmount.closedAt;
    
    const ledgerFilter = {
        "paymentMethod" : "cash",
        "after"         : lastClosedAt,
    };

    const incomes = await incomeService.get(ledgerFilter, onError);
    const incomeSum = incomes.reduce((sum, income) => sum + income.amount, 0);

    const expenses = await expenseService.get(ledgerFilter, onError);
    const expenseSum = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const total = lastClosedPettyCashAmount.balance + incomeSum - expenseSum;
    
    return total;
}
