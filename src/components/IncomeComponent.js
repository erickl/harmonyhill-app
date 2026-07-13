import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import { Pencil, Trash2, Flag } from 'lucide-react';
import Spinner from './Spinner.js';
import MetaInfo from './MetaInfo.js';
import IssueFlagButton from './IssueFlagButton.js';
import * as bookingService from "../services/bookingService.js";
import * as activityService from "../services/activityService.js";
import * as issueService from "../services/issueService.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from '../context/SuccessContext.js';
import "./IncomeComponent.css";

export default function IncomeComponent({income, handleDelete, context}) {
    const [expanded,         setExpanded        ] = useState(false);
    const [loading,          setLoading         ] = useState(false);
    const [booking,          setBooking         ] = useState(null);
    const [activity,         setActivity        ] = useState(null);
    const [issue,            setIssue           ] = useState(null);

    const { permissions} = useUserPermissions();
    const { onError    } = useNotification();
    const { onSuccess  } = useSuccessNotification();

    const fetchBookingInfo = async (income) => {
        if(!utils.isEmpty(income.bookingId)) {
            const booking_ = await bookingService.getOne(income.bookingId);
            setBooking(booking_)

            if(income.activityId) {
                const activity_ = await activityService.getOne(income.bookingId, income.activityId);
                setActivity(activity_)  
            }
        }
    };

    const onFlagIssue = async(incomeToFlag, comment) => {
        const result = await issueService.flagIssue(incomeToFlag, comment, onError);
        if(result !== false) {
            onSuccess();
        }
    }

    const handleSetExpanded = async(income) => {
        if(!expanded) {
            setLoading(prev => !prev);  
            await fetchBookingInfo(income);
            if(income.issue === "attention") {
                const issue_ = await issueService.getLastIssue(income);
                setIssue(issue_);
            }
            setLoading(prev => !prev);
        }
        setExpanded(prev => !prev);
    }

    return (
        <div className="income-box" onClick={()=> handleSetExpanded(income)}>
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
                        {expanded ? '▼' : '▶'}
                    </div>
                </div>
            </div>  
            
            <div>
                {utils.to_ddMMYY(income.purchasedAt, "/")}
            </div>

            { expanded && loading ? (
                <Spinner />
            ) : expanded && !loading ? (
                 <div className="income-body">
                    {issue && !utils.isEmpty(issue.comment) && (
                        <div style={{color:"red"}}>
                            Issue: {issue.comment}
                        </div>
                    )}
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

                        { permissions.canEditIncomes && (
                            <div className="income-body-footer-icon">
                                <Pencil   
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        context.onNavigate("edit-income", {customer:booking, incomeToEdit:income});
                                    }}
                                />
                                <p>Edit</p>
                            </div>
                        )}

                        {permissions.canDeleteIncomes && (
                            <div className="income-body-footer-icon">
                                <Trash2  
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(income);
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
    );
}