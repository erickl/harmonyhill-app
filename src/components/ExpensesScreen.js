import React, { useState, useEffect } from 'react';
import * as expenseService from "../services/expenseService.js";
import { useNotification } from "../context/NotificationContext.js";
import * as utils from "../utils.js";
import * as bookingService from "../services/bookingService.js";
import * as activityService from "../services/activityService.js";
import * as userService from "../services/userService.js";
import * as ledgerService from "../services/ledgerService.js";
import "./ExpensesScreen.css";
import Spinner from "./Spinner.js";
import invoiceLogo from "../assets/invoice-icon.png";
import AddExpensesScreen from "./AddExpensesScreen.js";
import ConfirmModal from "./ConfirmModal.js";
import { Pencil, ShoppingCart, Trash2 } from 'lucide-react';
import SheetUploader from "./SheetUploader.js";
import MetaInfo from './MetaInfo.js';

export default function ExpensesScreen({ onNavigate, onClose }) {

    const [expandedExpenses, setExpandedExpenses] = useState({}   );
    const [loadingExpanded,  setLoadingExpanded ] = useState({}   );
    const [receipts,         setExpenses        ] = useState([]   );
    const [displayedReceipt, setDisplayedReceipt] = useState(null );
    const [loading,          setLoading         ] = useState(true );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [isAdmin,          setIsAdmin         ] = useState(false);
    const [expenseToEdit,    setExpenseToEdit   ] = useState(null );
    const [expenseToDelete,  setExpenseToDelete ] = useState(null );
    const [pettyCash,        setPettyCash       ] = useState(null );
    const [expenseSum,       setExpenseSum      ] = useState(null );

    const { onError } = useNotification();

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

    const getDataForExport = async(filterValues) => {
        const rows = await expenseService.toArrays(filterValues, onError);
        return rows;
    }

    const fetchBookingInfo = async (expense) => {
        let updatedExpandedList = { ...(expandedExpenses || {}) };
        
        const expand = utils.isEmpty(updatedExpandedList[expense.id]);
        if(expand) {
            if(!utils.isEmpty(expense.bookingId)) {
                const booking = await bookingService.getOne(expense.bookingId);
                expense.bookingName = booking ? booking.name: "missing booking";

                if(expense.activityId) {
                    const activity = await activityService.getOne(expense.bookingId, expense.activityId);
                    expense.activityName = activity ? activity.displayName : "missing activity";
                }
            }
            updatedExpandedList[expense.id] = expense;
        } else {
            updatedExpandedList[expense.id] = null;
        }

        setExpandedExpenses(updatedExpandedList);
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
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);

            // While the manager just is concerned with petty cash, he has no reason to see all bank transfers
            const filter = userIsAdmin ? {} : {paymentMethod : "cash"};
            const uploadedExpenses = await expenseService.get(filter, onError);
            setExpenses(uploadedExpenses);
            
            const pettyCashSum = await ledgerService.getPettyCashBalance(onError);
            setPettyCash(pettyCashSum);
            const expenseSum = await ledgerService.getTotalExpenses(filter, onError);
            setExpenseSum(expenseSum);

            setLoading(false);
        }

        fetchExpenses();
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
        return (
            <AddExpensesScreen 
                expenseToEdit={expenseToEdit} 
                onNavigate={onNavigate} 
                onClose={() => setExpenseToEdit(null)}
            />
        );
    }
     
    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Expenses</h2>
                    {pettyCash && (<h4>Petty Cash: {utils.formatDisplayPrice(pettyCash, true)}</h4>)}
                </div>
            
                <div className="card-header-right">
                    {isAdmin && (<SheetUploader onExportRequest={getDataForExport} filterHeaders={filterHeaders}/>)}
                    <button className="add-button" onClick={() => onClose()}>
                        +
                    </button>
                    {expenseSum && (<h4>Expense: {utils.formatDisplayPrice(expenseSum, true)}</h4>)}
                </div>
            </div>
            <div className="card-content">
                
                
                {receipts.map((expense) => {
                    return (
                        <React.Fragment key={expense.id}>
                            <div className="expense-box" onClick={()=> handleSetExpanded(expense)}>
                                <div className="expense-header">
                                    <div className="expense-header-left">
                                        <div className="expense-title">
                                            {`${expense.index}. ${utils.capitalizeWords(expense.description)}`}
                                        </div>
                                    </div>
                                    <div className="expense-header-right">
                                        <div>
                                            {utils.formatDisplayPrice(expense.amount, true)}
                                            
                                        </div>
                                        <div className="expand-icon">
                                            {expandedExpenses[expense.id] ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.to_ddMMYY(expense.purchasedAt, "/")}
                                </div>

                                {loadingExpanded?.[expense.id] === true ? (
                                    <Spinner />
                                ) : expandedExpenses?.[expense.id] ? (
                                    <div className="expense-body">
                                        <div>
                                            Payment Method: {utils.capitalizeWords(expense.paymentMethod)}
                                        </div>
                                        <div>
                                            Category: {utils.capitalizeWords(expense.category)}
                                        </div>
                                        <div>
                                            Created At: {utils.to_yyMMddHHmm(expense.createdAt, "/")}
                                        </div>
                                        <div>
                                            Created By: {utils.capitalizeWords(expense.createdBy)}
                                        </div>
                                        {expense.bookingName && (<div>
                                            Booking: {expense.bookingName}
                                        </div>)}
                                        {expense.activityName && (<div>
                                            Activity: {expense.activityName}
                                        </div>)}
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
                                            <div className="expense-body-footer-icon">
                                                <img 
                                                    className="expense-thumbnail" 
                                                    //src={expense.thumbNailUrl} 
                                                    src={invoiceLogo} 
                                                    alt={`preview-${expense.id}`} 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDisplayedReceipt(expense);
                                                    }}
                                                />
                                                <p>Receipt</p>
                                            </div>
                                        </div>
                                        <MetaInfo document={expense}/>
                                    </div>
                                ) : (<></>)}
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
