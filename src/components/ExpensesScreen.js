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
import ExpenseList from './ExpenseList.js';

export default function ExpensesScreen({ context }) {

    const [expandedExpenses, setExpandedExpenses] = useState({}   );
    const [loadingExpanded,  setLoadingExpanded ] = useState({}   );
    const [expenses,         setExpenses        ] = useState([]   );
    const [loading,          setLoading         ] = useState(true );
    const [pettyCash,        setPettyCash       ] = useState(null );
    const [expenseSum,       setExpenseSum      ] = useState(null );

    const [recentFilter, setRecentFilter] = useState(null);
    const [issuesFilter, setIssuesFilter] = useState(null);
    const [pastFilter,   setPastFilter] = useState(null);

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

    useEffect(() => {
        const loadData = async () => {
            let filter = {};

            if(!permissions.isAdmin) {
                // While the manager just is concerned with petty cash, he has no reason to see all bank transfers
                filter["paymentMethod"] = "cash";
            } 

            const pettyCashSum = await ledgerService.getPettyCashBalance(null, onError);
            setPettyCash(pettyCashSum);
            const expenseSum = await ledgerService.getCurrentTotalExpenses(filter, onError);
            setExpenseSum(expenseSum);

            const lastClosedPettyCashRecord = await ledgerService.getLastClosedPettyCashRecord(null, onError);       
            
            const weekAgo = utils.today(-7);
            const oldest = lastClosedPettyCashRecord ? lastClosedPettyCashRecord.closedAt : weekAgo;
            
            let recentFilterAfter = weekAgo;
            if(oldest >= weekAgo) {
                recentFilterAfter = oldest;
            } else {
                const pastFilter = {...filter, after: oldest, before: utils.today(-7).plus({seconds : -1})};
                setPastFilter(pastFilter);
            }

            const recentFilter = {...filter, after : recentFilterAfter, before : utils.today(3)};
            setRecentFilter(recentFilter);
  
            const issuesFilter = { ...filter, "issue" : "attention"};
            setIssuesFilter(issuesFilter);
        }

        loadData();
    }, []);

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <div className="card-header-left-title">
                        <h2 className="card-title">Expenses</h2>
                        {pettyCash && (
                            <span>
                                Petty Cash: {utils.formatDisplayPrice(pettyCash, true)}
                            </span>
                        )}
                    </div>    
                </div>
            
                <div className="card-header-right">
                    <div>
                        <div className="card-header-right-top-row">
                            
                            {permissions.isAdmin && (<>
                                <SheetUploader label={"Expenses"} onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>
                                <ImageDown style={{margin:"1rem"}} onClick={() => handleReceiptsDownloadFilter()} />
                            </>)}

                            {permissions.canAddIncomes && (
                                <button className="add-button" onClick={() => context.onNavigate("add-expense")}>
                                    + 
                                </button>
                            )}
                        </div>
                        {expenseSum && (<h4>Expense: {utils.formatDisplayPrice(expenseSum, true)}</h4>)}
                    </div>
                </div>  
            </div>
            <div className="card-content">
                {false && issuesFilter && (
                    <ExpenseList 
                        context={context}
                        title={"Issues"}
                        filter={issuesFilter}
                        expand={true}
                        subscribe={true}
                    />
                )}

                {recentFilter && (
                    <ExpenseList 
                        context={context}
                        title={"Recent"}
                        filter={recentFilter}
                        expand={true}
                        subscribe={true}
                    />
                )}

                {pastFilter && (
                    <ExpenseList 
                        context={context}
                        title={"Previous"}
                        filter={recentFilter}
                    />
                )}
            </div>
        </div>
    )
}
