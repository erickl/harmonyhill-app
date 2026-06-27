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

export default function IncomeScreen({ customer, onNavigate, onClose }) {
    const [expandedIncomes,     setExpandedIncomes     ] = useState({}   );
    const [loadingExpanded,     setLoadingExpanded     ] = useState({}   );
    const [incomes,             setIncomes             ] = useState([]   );
    const [loading,             setLoading             ] = useState(true );
    const [pettyCash,           setPettyCash           ] = useState(null );
    const [incomeSum,           setIncomeSum           ] = useState(null );

    const { onError   } = useNotification();
    const { onSuccess } = useSuccessNotification();
    const { onConfirm } = useConfirmationModal();
    const { permissions } = useUserPermissions();

    const filterHeaders = {
        "after"  : "date",
        "before" : "date",
        "paymentMethod" : "string",
    };

    const handleSetExpanded = async(income) => {
        setLoadingExpanded((prev) => ({...prev, [income.id]: true}));
        await fetchBookingInfo(income);
        setLoadingExpanded((prev) => ({...prev, [income.id]: false}));
    }

    const fetchBookingInfo = async (income) => {
        if(!income) return;

        let updatedExpandedList = { ...(expandedIncomes || {}) };

        const expand = utils.isEmpty(updatedExpandedList[income.id]);

        if(expand) {
            if(!utils.isEmpty(income.bookingId)) {
                const booking = await bookingService.getOne(income.bookingId);
                income.bookingName = booking.name;
            }
            updatedExpandedList[income.id] = income;
        } else {
            updatedExpandedList[income.id] = null;
        }

        setExpandedIncomes(updatedExpandedList);
    };

    const handleDeleteIncome = async(incomeToDelete) => {
        if(!incomeToDelete || utils.isEmpty(incomeToDelete.id)) return;
        onConfirm(`Are you sure you want to delete income ${incomeToDelete.id}?`, async () => {
            const result = await incomeService.remove(incomeToDelete.id, onError);
            if(result !== false) {
                let newIncomes = utils.deepCopy(incomes);
                newIncomes = newIncomes.filter((income) => income.id !== incomeToDelete.id);
                setIncomes(newIncomes);
                onSuccess();
            }
        });
    }

    const getDataForExport = async(filterValues, onProgress) => {
        const rows = await incomeService.toArrays(filterValues, onProgress, onError);
        return rows;
    }

    useEffect(() => {
        const fetchIncomes = async() => {
            const filter = {};
            if(customer) {
                filter["bookingId"] = customer.id;
            } else {
                const lastClosedPettyCashRecord = await ledgerService.getLastClosedPettyCashRecord(null, onError);
                filter["after"] = lastClosedPettyCashRecord ? lastClosedPettyCashRecord.closedAt : null;
            }
            
            const uploadedIncomes = await incomeService.get(filter, onError);
            setIncomes(uploadedIncomes);
            setLoading(false);
        }

        const getCashFlow = async() => {
            const pettyCashSum = await ledgerService.getPettyCashBalance(null, onError);
            setPettyCash(pettyCashSum);
            
            const incomeSum = await ledgerService.getCurrentTotalIncomes(onError);
            setIncomeSum(incomeSum);
        }

        fetchIncomes();
        getCashFlow();
    }, []);

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }

    const incomeFromText = customer ? `: ${customer.name}` : "";
     
    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <h2 className="card-title">Income {incomeFromText}</h2>
                    {pettyCash && (<h4>Petty Cash: {utils.formatDisplayPrice(pettyCash, true)}</h4>)}    
                </div>

                <div className="card-header-right">
                    <div>
                        <div className="card-header-right-top-row">
                            {permissions.isAdmin && (<>
                                <SheetUploader label={"Incomes"} onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>
                            </>)}
                            <button className="add-button" onClick={() => onNavigate("add-income", {customer:customer})}>
                                + 
                            </button>
                        </div>
                        {incomeSum && (<h4>Income (excl top ups): {utils.formatDisplayPrice(incomeSum, true)}</h4>)}
                    </div>
                </div>  
            </div>
            <div className="card-content">
                {incomes.map((income) => {
                    return (
                        <React.Fragment key={income.id}>
                            <div className="income-box" onClick={() => handleSetExpanded(income)}>
                                <div className="income-header">
                                    <div className="income-header-left">
                                        <div className="income-title">
                                            {`${income.index}. ${utils.capitalizeWords(income.description)}`}
                                        </div>
                                    </div>
                                    <div className="income-header-right">
                                        <div>
                                            {utils.formatDisplayPrice(income.amount, true)}
                                            
                                        </div>
                                        <div className="expand-icon">
                                            {expandedIncomes[income.id] ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>  

                                <div>
                                    {utils.to_ddMMYY(income.receivedAt, "/")}
                                </div>
                                
                               {loadingExpanded?.[income.id] === true ? (
                                    <Spinner />
                                ) : expandedIncomes?.[income.id] ? (
                                    <div className="income-body">
                                        {income.bookingName && (<div>
                                            Booking: {income.bookingName}
                                        </div>)}
                                        <div>
                                            Category: {utils.capitalizeWords(income.category)}
                                        </div>
                                        <div>
                                            Payment Method: {utils.capitalizeWords(income.paymentMethod)}
                                        </div>
                                        {income.comments && (<div>
                                            Comments: {income.comments}
                                        </div>)}
                                        <div className="income-body-footer">
                                            <div className="income-body-footer-icon">
                                                <Pencil   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onNavigate("edit-income", {customer:customer, incomeToEdit:income});
                                                    }}
                                                />
                                                <p>Edit</p>
                                            </div>
                                            {isManagerOrAdmin && (
                                                <div className="income-body-footer-icon">
                                                    <Trash2  
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteIncome(income);
                                                        }}
                                                    />
                                                    <p>Delete</p>
                                                </div>
                                            )}
                                        </div>
                                        <MetaInfo document={income}/>
                                    </div>
                                ) : (<></>)}
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
