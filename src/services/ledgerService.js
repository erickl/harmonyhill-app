import * as ledgerDao from "../daos/ledgerDao.js";
import * as incomeService from "./incomeService.js";
import * as expenseService from "./expenseService.js";
import * as utils from "../utils.js";

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
