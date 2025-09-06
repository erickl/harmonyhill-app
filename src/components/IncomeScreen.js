import React, { useState, useEffect } from 'react';
import * as incomeService from "../services/incomeService.js";
import * as userService from "../services/userService.js";
import * as bookingService from "../services/bookingService.js";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import * as ledgerService from "../services/ledgerService.js";
import * as utils from "../utils.js";
import "./IncomeScreen.css";
import AddIncomeScreen from './AddIncomeScreen.js';
import ConfirmModal from "./ConfirmModal.js";
import { Pencil, ShoppingCart, Trash2 } from 'lucide-react';

export default function IncomeScreen({ onNavigate, onClose }) {

    const [expandedIncomes,  setExpandedIncomes ] = useState({}   );
    const [incomeToEdit,     setIncomeToEdit    ] = useState(null );
    const [incomeToDelete,   setIncomeToDelete  ] = useState(null );
    const [incomes,          setIncomes         ] = useState([]   );
    const [loading,          setLoading         ] = useState(true );
    const [errorMessage,     setErrorMessage    ] = useState(null );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [pettyCash,        setPettyCash       ] = useState(null );

    const handleSetExpandedIncome = async (income) => {
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

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    useEffect(() => {
        const fetchIncomes = async() => {
            const filter = {};
            const uploadedIncomes = await incomeService.get(filter, onError);
            setIncomes(uploadedIncomes);
            setLoading(false);
        }

         const getPettyCash = async() => {
            const pettyCash = ledgerService.getPettyCashBalance(onError);
            setPettyCash(pettyCash);
        }
    
        fetchIncomes();
        getPettyCash();
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
        return (<AddIncomeScreen incomeToEdit={incomeToEdit} onNavigate={onNavigate} onClose={() => setIncomeToEdit(null)}/>)
    }
     
    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Income</h2>
                    {pettyCash && (<h4>Petty Cash: ${pettyCash}</h4>)}
                </div>
            
                <div>
                    <button className="add-button" onClick={() => onClose()}>
                        +
                    </button>
                </div>
            </div>
            <div>
                {incomes.map((income) => {
                    return (
                        <React.Fragment key={income.id}>
                            <div className="income-box" onClick={()=> handleSetExpandedIncome(income)}>
                                <div className="income-header">
                                    <div className="income-header-left">
                                        <div className="income-title">
                                            {utils.capitalizeWords(income.description)}
                                        </div>
                                    </div>
                                    <div className="income-header-right">
                                        <div>
                                            {utils.to_YYMMdd(income.purchasedAt)}
                                        </div>
                                        <div className="expand-icon">
                                            {expandedIncomes[income.id] ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.formatDisplayPrice(income.amount, true)}
                                </div>
                                {expandedIncomes[income.id] && (
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
                                                            handleDeleteIncome(income);
                                                        }}
                                                    />
                                                    <p>Delete</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    )
}
