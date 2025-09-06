import React, { useState, useEffect } from 'react';
import * as expenseService from "../services/expenseService.js";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import * as ledgerService from "../services/ledgerService.js";
import "./ExpensesScreen.css";
import invoiceLogo from "../assets/invoice-icon.png";
import AddExpensesScreen from "./AddExpensesScreen.js";
import ConfirmModal from "./ConfirmModal.js";
import { Pencil, ShoppingCart, Trash2 } from 'lucide-react';

export default function ExpensesScreen({ onNavigate, onClose }) {

    const [expandedExpenses, setExpandedExpenses] = useState({}   );
    const [receipts,         setExpenses        ] = useState([]   );
    const [displayedReceipt, setDisplayedReceipt] = useState(null );
    const [loading,          setLoading         ] = useState(true );
    const [errorMessage,     setErrorMessage    ] = useState(null );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [expenseToEdit,    setExpenseToEdit   ] = useState(null );
    const [expenseToDelete,  setExpenseToDelete ] = useState(null );
    const [pettyCash,        setPettyCash       ] = useState(null );

    const handleSetExpandedReceipt = (id) => {
        let updatedExpandedList = { ...(expandedExpenses || {}) };
        updatedExpandedList[id] = updatedExpandedList[id] === true ? false : true;
        setExpandedExpenses(updatedExpandedList);
    };

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    const handleEditExpense = async(expense) => {
        setExpenseToEdit(expense);
    }

    const handleDeleteExpense = async() => {
        if(!expenseToDelete || utils.isEmpty(expenseToDelete.id)) {
            return;
        }
        const result = await expenseService.remove(expenseToDelete.id, onError);
        if(result) {
            setExpenseToDelete(null);
        }
    }

    useEffect(() => {
        const fetchExpenses = async() => {
            const filter = {};
            const uploadedExpenses = await expenseService.get(filter, onError);
            setExpenses(uploadedExpenses);
            setLoading(false);
        }

        const getPettyCash = async() => {
            const pettyCash = ledgerService.getPettyCashBalance(onError);
            setPettyCash(pettyCash);
        }

        fetchExpenses();
        getPettyCash();
    }, [expenseToEdit, expenseToDelete]);

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

    if(expenseToEdit) {
        return (<AddExpensesScreen expenseToEdit={expenseToEdit} onNavigate={onNavigate} onClose={() => setExpenseToEdit(null)}/>)
    }
     
    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Expenses</h2>
                    {pettyCash && (<h4>Petty Cash: ${pettyCash}</h4>)}
                </div>
            
                <div>
                    <button className="add-button" onClick={() => onClose()}>
                        +
                    </button>
                </div>
            </div>
            <div>
                {receipts.map((expense) => {
                    return (
                        <React.Fragment key={expense.id}>
                            <div className="expense-box" onClick={()=> handleSetExpandedReceipt(expense.id)}>
                                <div className="expense-header">
                                    <div className="expense-header-left">
                                        <img 
                                            className="expense-thumbnail" 
                                            //src={expense.thumbNailUrl} 
                                            src={invoiceLogo} 
                                            alt={`preview-${expense.id}`} 
                                            onClick={() => setDisplayedReceipt(expense)}
                                        />
                                        
                                        <div className="expense-title">
                                            {utils.capitalizeWords(expense.description)}
                                        </div>
                                    </div>
                                    <div className="expense-header-right">
                                        <div>
                                            {utils.to_YYMMdd(expense.purchasedAt)}
                                        </div>
                                        <div className="expand-icon">
                                            {expandedExpenses[expense.id] ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.formatDisplayPrice(expense.amount, true)}
                                </div>
                                {expandedExpenses[expense.id] && (
                                    <div className="expense-body">
                                        <div>
                                            Payment Method: {utils.capitalizeWords(expense.paymentMethod)}
                                        </div>
                                        <div>
                                            Category: {utils.capitalizeWords(expense.category)}
                                        </div>
                                        {expense.comments && (<div>
                                            Comments: {expense.comments}
                                        </div>)}
                                        <div>
                                            Purchased By: {utils.capitalizeWords(expense.purchasedBy)}
                                        </div>
                                        <div className="expense-body-footer">
                                            <div className="expense-body-footer-icon">
                                                <Pencil   
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditExpense(expense);
                                                    }}
                                                />
                                                <p>Edit</p>
                                            </div>
                                            {isManagerOrAdmin && (
                                                <div className="expense-body-footer-icon">
                                                    <Trash2  
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpenseToDelete(expense);
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

            {expenseToDelete && (
                <ConfirmModal 
                    onCancel={() => setExpenseToDelete(null)}
                    onConfirm={handleDeleteExpense}
                />
            )}

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}

            {displayedReceipt && (
                <img 
                    className="expense-photo" 
                    src={displayedReceipt.photoUrl} 
                    alt={`expense-${displayedReceipt.id}`} 
                    onClick={() => setDisplayedReceipt(null)}
                />
            )}
        </div>
    )
}
