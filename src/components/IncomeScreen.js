import React, { useState, useEffect } from 'react';
import * as incomeService from "../services/incomeService.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as bookingService from "../services/bookingService.js";
import { useNotification } from "../context/NotificationContext.js";
import * as ledgerService from "../services/ledgerService.js";
import * as utils from "../utils.js";
import "./IncomeScreen.css";
import Spinner from "./Spinner.js";
import MetaInfo from './MetaInfo.js';
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { Pencil, Trash2 } from 'lucide-react';
import SheetUploader from "./SheetUploader.js";
import VeganHamburgerButton from './VeganHamburgerButton.js';
import IncomeList from './IncomeList.js';

export default function IncomeScreen({ customer, context }) {
    const [pettyCash,           setPettyCash           ] = useState(null );
    const [incomeSum,           setIncomeSum           ] = useState(null );
    const [recentFilter,        setRecentFilter        ] = useState(null );
    const [issuesFilter,        setIssuesFilter        ] = useState(null );
    const [pastFilter,          setPastFilter          ] = useState(null );

    const { onError   } = useNotification();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();
    const { permissions } = useUserPermissions();

    const filterHeaders = {
        "after"  : "date",
        "before" : "date",
        "paymentMethod" : "string",
    };

    const getDataForExport = async(filterValues, onProgress) => {
        const rows = await incomeService.toArrays(filterValues, onProgress, onError);
        return rows;
    }

    useEffect(() => {
        let filter = {};
        if(!permissions.isAdmin) {
            // While the manager just is concerned with petty cash, he has no reason to see all bank transfers
            filter["paymentMethod"] = "cash";
        } 

        const getCashFlow = async() => {
            const pettyCashSum = await ledgerService.getPettyCashBalance(null, onError);
            setPettyCash(pettyCashSum);
            
            const incomeSum = await ledgerService.getCurrentTotalIncomes(onError);
            setIncomeSum(incomeSum);
        }

        const loadData = async () => {
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

        getCashFlow();
        loadData();
    }, []);

    const incomeFromText = customer ? `: ${customer.name}` : "";
     
    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <div className="card-header-left-title">
                        <h2 className="title">Incomes</h2>
                        {pettyCash && (
                            <span className="amounts-data">
                                Petty Cash: {utils.formatDisplayPrice(pettyCash, true)}
                            </span>
                        )}
                        {incomeSum && (
                            <span className="amounts-data">
                                Total (excl top ups): {utils.formatDisplayPrice(incomeSum, true)}
                            </span>
                        )}
                    </div>    
                </div>

                <div className="card-header-right">
                    <div>
                        <div className="card-header-right-top-row">
                            {permissions.isAdmin && (<>
                                <SheetUploader label={""} onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>
                            </>)}

                            {permissions.canAddIncomes && (
                                <button className="add-button" onClick={() => context.onNavigate("add-income", {customer:customer})}>
                                    + 
                                </button>
                            )}
                        </div>
                    </div>
                </div>  
            </div>
            <div className="card-content">
                <IncomeList
                    title={"Recent"}
                    context={context}
                    filter={recentFilter}
                    subscribe={true}
                    expand={true}
                />

                <IncomeList
                    title={"Previous"}
                    context={context}
                    filter={pastFilter}
                />
            </div>
        </div>
    )
}
