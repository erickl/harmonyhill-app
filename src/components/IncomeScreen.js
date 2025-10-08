import React, { useState, useEffect } from 'react';
import * as incomeService from "../services/incomeService.js";
import * as userService from "../services/userService.js";
import * as bookingService from "../services/bookingService.js";
import { useNotification } from "../context/NotificationContext.js";
import * as ledgerService from "../services/ledgerService.js";
import * as utils from "../utils.js";
import "./IncomeScreen.css";
import Spinner from "./Spinner.js";
import MetaInfo from './MetaInfo.js';
import AddIncomeScreen from './AddIncomeScreen.js';
import ConfirmModal from "./ConfirmModal.js";
import { Pencil, ShoppingCart, Trash2 } from 'lucide-react';

export default function IncomeScreen({ onNavigate, onClose }) {

    const [expandedIncomes,     setExpandedIncomes     ] = useState({}   );
    const [loadingExpanded,     setLoadingExpanded     ] = useState({}   );
    const [incomeToEdit,        setIncomeToEdit        ] = useState(null );
    const [incomeToDelete,      setIncomeToDelete      ] = useState(null );
    const [incomes,             setIncomes             ] = useState([]   );
    const [loading,             setLoading             ] = useState(true );
    const [isManagerOrAdmin,    setIsManagerOrAdmin    ] = useState(false);
    const [pettyCash,           setPettyCash           ] = useState(null );
    const [incomeSum,           setIncomeSum           ] = useState(null );

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

    const handleEditIncome = async(income) => {
        setIncomeToEdit(income);
    }

    const handleDeleteIncome = async() => {
        if(!incomeToDelete || utils.isEmpty(incomeToDelete.id)) {
            return;
        }
        const result = await incomeService.remove(incomeToDelete.id, onError);
        if(result) {
            setIncomeToDelete(null);
        }
    }

    const { onError } = useNotification();

    useEffect(() => {
        const fetchIncomes = async() => {
            const lastClosedPettyCashRecord = await ledgerService.getLastClosedPettyCashRecord(onError);
            const filter = lastClosedPettyCashRecord ? { "after" : lastClosedPettyCashRecord.closedAt} : {};
            const uploadedIncomes = await incomeService.get(filter, onError);
            setIncomes(uploadedIncomes);
            setLoading(false);
        }

        const getCashFlow = async() => {
            const pettyCashSum = await ledgerService.getPettyCashBalance(null, onError);
            setPettyCash(pettyCashSum);
            const incomeSum = await ledgerService.getTotalIncomes(onError);
            setIncomeSum(incomeSum);
        }
    
        fetchIncomes();
        getCashFlow();
    }, [incomeToEdit, incomeToDelete]);

    useEffect(() => {
        const getUserPermissions = async() => {
            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);
        }

        getUserPermissions();
    }, []);

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }

    if(incomeToEdit) {
        return (
            <AddIncomeScreen 
                incomeToEdit={incomeToEdit} 
                onNavigate={onNavigate} 
                onClose={() => setIncomeToEdit(null)}
            />
        );
    }
     
    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Income</h2>
                    {pettyCash && (<h4>Petty Cash: {utils.formatDisplayPrice(pettyCash, true)}</h4>)}
                </div>
            
                <div>
                    <button className="add-button" onClick={() => onClose()}>
                        +
                    </button>
                    {incomeSum && (<h4>Income (excl top ups): {utils.formatDisplayPrice(incomeSum, true)}</h4>)}
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
                                                        handleEditIncome(income);
                                                    }}
                                                />
                                                <p>Edit</p>
                                            </div>
                                            {isManagerOrAdmin && (
                                                <div className="income-body-footer-icon">
                                                    <Trash2  
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIncomeToDelete(income);
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

            {incomeToDelete && (
                <ConfirmModal 
                    onCancel={() => setIncomeToDelete(null)}
                    onConfirm={handleDeleteIncome}
                />
            )}
        </div>
    )
}
