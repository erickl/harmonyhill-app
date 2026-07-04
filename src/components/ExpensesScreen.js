import React, { useState, useEffect } from 'react';
import * as expenseService from "../services/expenseService.js";
import { useNotification } from "../context/NotificationContext.js";
import * as utils from "../utils.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as ledgerService from "../services/ledgerService.js";
import * as issueService from "../services/issueService.js";
import "./ExpensesScreen.css";
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { ImageDown } from 'lucide-react';
import SheetUploader from "./SheetUploader.js";
import ExpenseComponent from "./ExpenseComponent.js";
import { useFilters } from "../context/FilterContext.js";
import { useProgressCounter } from "../context/ProgressContext.js";

export default function ExpensesScreen({ onNavigate, onClose }) {

    const [expandedExpenses, setExpandedExpenses] = useState({}   );
    const [loadingExpanded,  setLoadingExpanded ] = useState({}   );
    const [expenses,         setExpenses        ] = useState([]   );
    const [issues,           setIssues          ] = useState([]   );
    const [loading,          setLoading         ] = useState(true );
    const [pettyCash,        setPettyCash       ] = useState(null );
    const [expenseSum,       setExpenseSum      ] = useState(null );

    const { onFilter   } = useFilters();
    const { onError    } = useNotification();
    const { onProgress } = useProgressCounter();
    const { onConfirm  } = useConfirmationModal();
    const { onSuccess  } = useSuccessNotification();
    const { permissions} = useUserPermissions();

    const filterHeaders = {
        "after"  : "date",
        "before" : "date",
        "paymentMethod" : "string",
    };

    const getDataForExport = async(filterValues, onProgress) => {
        const rows = await expenseService.toArrays(filterValues, onProgress, onError);
        return rows;
    }

    const handleReceiptsDownloadFilter = async() => {
        const onFilterValuesSubmit = (filterValues) => {
            handlePicturesDownload(filterValues);
        };
        onFilter(filterHeaders, onFilterValuesSubmit);
    }

    const handlePicturesDownload = async(filters) => {
        const filename = `receipts`;
        const success = await expenseService.downloadExpenseReceipts(filename, filters, onProgress, onError);
        const x = 1; // todo, if success = true, display onSuccess?
    }

    const handleDeleteExpense = async(expenseToDelete) => {
        if(!expenseToDelete || utils.isEmpty(expenseToDelete.id)) return;
        
        onConfirm(`Are you sure you want to delete expense ${expenseToDelete.id}?`, async () => {
            const result = await expenseService.remove(expenseToDelete.id, onError);
            if(result !== false) {
                let newExpenses = utils.deepCopy(expenses);
                newExpenses = newExpenses.filter((expense) => expense.id !== expenseToDelete.id);
                setExpenses(newExpenses);
                onSuccess();
            }
        });
    }

    const onFlagIssue = async(expenseToFlag, comment) => {
        const result = await issueService.flagIssue(expenseToFlag, comment, onError);
        if(result !== false) {
            let newIssues = [...issues, expenseToFlag];
            setIssues(newIssues)
        }
    }

    useEffect(() => {
        const fetchExpenses = async() => {
            const lastClosedPettyCashRecord = await ledgerService.getLastClosedPettyCashRecord(null, onError);

            const filter = lastClosedPettyCashRecord ? { "after" : lastClosedPettyCashRecord.closedAt} : {};
            
            if(!permissions.isAdmin) {
                // While the manager just is concerned with petty cash, he has no reason to see all bank transfers
                filter["paymentMethod"] = "cash";
            } 

            const uploadedExpenses = await expenseService.get(filter, onError);
            setExpenses(uploadedExpenses);
            
            const pettyCashSum = await ledgerService.getPettyCashBalance(null, onError);
            setPettyCash(pettyCashSum);
            const expenseSum = await ledgerService.getCurrentTotalExpenses(filter, onError);
            setExpenseSum(expenseSum);

            setLoading(false);

            const issues = await issueService.get("expenses", {}, onError);
            setIssues(issues);
        }

        fetchExpenses();
    }, []);

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }
     
    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <h2 className="card-title">Expenses</h2>
                    {pettyCash && (<h4>Petty Cash: {utils.formatDisplayPrice(pettyCash, true)}</h4>)}    
                </div>
            
                <div className="card-header-right">
                    <div>
                        <div className="card-header-right-top-row">
                            {permissions.isAdmin && (<>
                                <SheetUploader label={"Expenses"} onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>
                                <ImageDown style={{margin:"1rem"}} onClick={() => handleReceiptsDownloadFilter()} />
                            </>)}
                            <button className="add-button" onClick={() => onNavigate("add-expense")}>
                                + 
                            </button>
                        </div>
                        {expenseSum && (<h4>Expense: {utils.formatDisplayPrice(expenseSum, true)}</h4>)}
                    </div>
                </div>  
            </div>
            {issues && issues.length > 0 && (<>
                <h2 className="issues-header">Issues</h2>
                <div className="card-content error-card-content">
                    {issues.map((expense) => {
                        return (
                            <React.Fragment key={expense.id}>
                                <ExpenseComponent 
                                    expense={expense} 
                                    handleDelete={handleDeleteExpense}
                                    onFlagIssue={onFlagIssue}
                                    onNavigate={onNavigate}
                                />
                            </React.Fragment>
                        )
                    })}
                </div>
            </>)}
            <div className="card-content">
                {expenses.map((expense) => {
                    return (
                        <React.Fragment key={expense.id}>
                            <ExpenseComponent 
                                expense={expense} 
                                handleDelete={handleDeleteExpense}
                                onFlagIssue={onFlagIssue}
                                onNavigate={onNavigate}
                            />
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
