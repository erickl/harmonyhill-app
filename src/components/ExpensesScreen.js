import React, { useState, useEffect } from 'react';
import * as expenseService from "../services/expenseService.js";
import { useNotification } from "../context/NotificationContext.js";
import * as utils from "../utils.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as ledgerService from "../services/ledgerService.js";
import * as issueService from "../services/issueService.js";
import "./ExpensesScreen.css";
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { ImageDown } from 'lucide-react';
import SheetUploader from "./SheetUploader.js";
import ExpenseComponent from "./ExpenseComponent.js";
import { useProgressCounter } from "../context/ProgressContext.js";
import ExpenseList from './ExpenseList.js';
import { Filter, FilterX } from 'lucide-react';
import { useFilters } from "../context/FilterContext.js";

export default function ExpensesScreen({ context }) {
    const [pettyCash,        setPettyCash       ] = useState(null );
    const [expenseSum,       setExpenseSum      ] = useState(null );

    const [customInterval,        setCustomInterval]        = useState(null);
    const [recentFilter,          setRecentFilter]          = useState(null);
    const [issuesFilter,          setIssuesFilter]          = useState(null);
    const [pendingApprovalFilter, setPendingApprovalFilter] = useState(null);
    const [pastFilter,            setPastFilter]            = useState(null);
    const [showFilter,        setShowFilter        ] = useState(false);

    const { onFilter   } = useFilters();
    const { onError    } = useNotification();
    const { onProgress } = useProgressCounter();
    const { permissions} = useUserPermissions();

    const filterHeaders = {
        "after"  : "date",
        "before" : "date",
        "paymentMethod" : "string",
    };

    const onFilterValuesSubmit = (filterValues) => {
        setCustomInterval({
            after  : filterValues.after,
            before : filterValues.before
        });
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
        let filter = {};
        if(!permissions.isAdmin) {
            // While the manager just is concerned with petty cash, he has no reason to see all bank transfers
            filter["paymentMethod"] = "cash";
        } 

        const loadTotals = async() => {
            const pettyCashSum = await ledgerService.getPettyCashBalance(null, onError);
            setPettyCash(pettyCashSum);
            const expenseSum = await ledgerService.getCurrentTotalExpenses(filter, onError);
            setExpenseSum(expenseSum);
        }

        const loadData = async () => {
            const lastClosedPettyCashRecord = await ledgerService.getLastClosedPettyCashRecord(null, onError);       
            
            // In Recent tab, display records from a week ago at the oldest
            const monthStart = utils.monthStart();
            const oldest = lastClosedPettyCashRecord ? lastClosedPettyCashRecord.closedAt : monthStart;
            
            let recentFilterAfter = utils.today(-7);
            if(oldest >= monthStart) {
                recentFilterAfter = oldest;
            } else {
                const pastFilter = {...filter, after: oldest, before: recentFilterAfter.plus({seconds : -1})};
                setPastFilter(pastFilter);
            }

            const recentFilter = {...filter, after : recentFilterAfter};
            setRecentFilter(recentFilter);
  
            const issuesFilter = { ...filter, "issue" : "attention"};
            setIssuesFilter(issuesFilter);

            const pendingApprovalFilter = { ...filter, "issue" : "pending_approval"};
            setPendingApprovalFilter(pendingApprovalFilter);
        }

        loadTotals();
        loadData();
    }, []);

    const downloadIconStyle = {
        marginRight:"1rem"
    }

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <div className="card-header-left-title">
                        <h2 className="title">Expenses</h2>
                        {pettyCash && (
                            <span className="amounts-data">
                                Petty Cash: {utils.formatDisplayPrice(pettyCash, true)}
                            </span>
                        )}
                        {expenseSum && (
                            <span className="amounts-data">
                                Total: {utils.formatDisplayPrice(expenseSum, true)}
                            </span>
                        )}
                    </div>    
                </div>
            
                <div className="card-header-right">
                    <div>
                        <div className="card-header-right-top-row">
                            
                            {permissions.isAdmin && (<>
                                <SheetUploader label={""} onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>
                                <ImageDown style={downloadIconStyle} onClick={() => handleReceiptsDownloadFilter()} />
                            </>)}

                            {permissions.isAdmin && context.enableFilters && (<>    
                                <Filter 
                                    //onClick={() => setShowFilter(prev => !prev)}
                                    onClick={() => onFilter(filterHeaders, onFilterValuesSubmit)}
                                />
                            </>)}

                            {permissions.canAddIncomes && (
                                <button className="add-button" onClick={() => context.onNavigate("add-expense")}>
                                    + 
                                </button>
                            )}
                        </div>
                        
                    </div>
                </div>  
            </div>
            <div className="card-content">
                {context.enableRecordIssues && (<>
                    {pendingApprovalFilter && (
                        <ExpenseList 
                            context={context}
                            title={"Pending Approval"}
                            filter={pendingApprovalFilter}
                            expand={true}
                            subscribe={true}
                        />
                    )}

                    {issuesFilter && (
                        <ExpenseList 
                            context={context}
                            title={"Issues"}
                            filter={issuesFilter}
                            expand={true}
                            subscribe={true}
                        />
                    )}
                </>)}

                {customInterval !== null ? (
                    <ExpenseList 
                        context={context} 
                        title={"Custom"} 
                        filter={customInterval} 
                        expand={true}
                    /> 
                ) : (<>
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
                            filter={pastFilter}
                        />
                    )}
                </>)}
            </div>
        </div>
    )
}
