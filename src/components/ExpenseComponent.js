import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import { Pencil, Trash2, Flag } from 'lucide-react';
import Spinner from './Spinner.js';
import MetaInfo from './MetaInfo.js';
import IssueFlagButton from './IssueFlagButton.js';
import * as bookingService from "../services/bookingService.js";
import * as activityService from "../services/activityService.js";
import * as issueService from "../services/issueService.js";
import invoiceLogo from "../assets/invoice-icon.png";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from '../context/SuccessContext.js';
import "./ExpenseComponent.css";

export default function ExpenseComponent({expense, handleDelete, context}) {
    const [displayedReceipt, setDisplayedReceipt] = useState(null );
    const [expanded,         setExpanded        ] = useState(false);
    const [loading,          setLoading         ] = useState(false);
    const [booking,          setBooking         ] = useState(null);
    const [activity,         setActivity        ] = useState(null);
    const [issue,            setIssue           ] = useState(null);

    const { permissions} = useUserPermissions();
    const { onError    } = useNotification();
    const { onSuccess  } = useSuccessNotification();

    const fetchBookingInfo = async (expense) => {
        if(!utils.isEmpty(expense.bookingId)) {
            const booking_ = await bookingService.getOne(expense.bookingId);
            setBooking(booking_)

            if(expense.activityId) {
                const activity_ = await activityService.getOne(expense.bookingId, expense.activityId);
                setActivity(activity_)  
            }
        }
    };

    const onFlagIssue = async(expenseToFlag, comment) => {
        const result = await issueService.flagIssue(expenseToFlag, comment, onError);
        if(result !== false) {
            onSuccess();
        }
    }

    const handleSetExpanded = async(expense) => {
        if(!expanded) {
            setLoading(prev => !prev);  
            await fetchBookingInfo(expense);
            if(expense.issue === "attention") {
                const issue_ = await issueService.getLastIssue(expense);
                setIssue(issue_);
            }
            setLoading(prev => !prev);
        }
        setExpanded(prev => !prev);
    }

    return (
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
                        {expanded ? '▼' : '▶'}
                    </div>
                </div>
            </div>  
            
            <div>
                {utils.to_ddMMYY(expense.purchasedAt, "/")}
            </div>

            { expanded && loading ? (
                <Spinner />
            ) : expanded && !loading ? (
                <div className="expense-body">
                    {issue && !utils.isEmpty(issue.comment) && (
                        <div style={{color:"red"}}>
                            Issue: {issue.comment}
                        </div>
                    )}
                    <div>
                        Payment Method: {utils.capitalizeWords(expense.paymentMethod)}
                    </div>
                    <div>
                        Category: {utils.capitalizeWords(expense.category)}
                    </div>
                    {booking && (<div>
                        Booking: {booking.name}
                    </div>)}
                    {activity && (<div>
                        Activity: {activity.displayName}
                    </div>)}
                    {expense.comments && (<div>
                        Comments: {expense.comments}
                    </div>)}
                    <div>
                        Purchased By: {utils.capitalizeWords(expense.purchasedBy)}
                    </div>
                    <div className="expense-body-footer">
                        
                        { permissions.canEditExpenses && (
                            <div className="expense-body-footer-icon">
                                <Pencil   
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        context.onNavigate("edit-expense", {expenseToEdit:expense})
                                    }}
                                />
                                <p>Edit</p>
                            </div>
                        )}

                        {permissions.canDeleteExpenses && (
                            <div className="expense-body-footer-icon">
                                <Trash2  
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(expense);
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

                        {false && permissions.isAdmin && (
                            <IssueFlagButton 
                                record={expense}
                                onFlagIssue={onFlagIssue}
                            />
                        )}

                    </div>
                    <MetaInfo document={expense}/>
                </div>
            ) : (<></>)}

            {displayedReceipt && (
                <img 
                    className="expense-photo" 
                    src={displayedReceipt.photoUrl} 
                    alt={`expense-${displayedReceipt.id}`} 
                    onClick={() => setDisplayedReceipt(null)}
                />
            )}
        </div>
    );
}