import React, { useEffect, useState } from "react";
import * as expenseService from "../services/expenseService.js";
import * as utils from "../utils.js";
import "./ExpenseList.css";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import ExpenseComponent from "./ExpenseComponent.js";

export default function ExpenseList({context, title, filter, expand, subscribe}) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [expand_, setExpand] = useState(expand || false);

    const {onError} = useNotification();
    const {onSuccess} = useSuccessNotification();
    const {onConfirm} = useConfirmationModal();

    const handleExpand = () => {
        if(expand_ === false && !subscribe) {
            fetchExpenses();
        }
        setExpand(prev => !prev);
    }
    
    const handleDeleteExpense = async(expenseToDelete) => {
        if(!expenseToDelete || utils.isEmpty(expenseToDelete.id)) return;
        
        onConfirm(`Are you sure you want to delete expense ${expenseToDelete.id}?`, async () => {
            const result = await expenseService.remove(expenseToDelete.id, onError);
            if(result !== false) {
                if(subscribe) return;
                let newExpenses = utils.deepCopy(expenses);
                newExpenses = newExpenses.filter((expense) => expense.id !== expenseToDelete.id);
                setExpenses(newExpenses);
                onSuccess();
            }
        });
    }

    const fetchExpenses = async() => {
        setLoading(prev => !prev);
        const uploadedExpenses = await expenseService.get(filter, onError);
        setExpenses(uploadedExpenses);
        setLoading(prev => !prev);
    }

    useEffect(() => {
        if(!subscribe) fetchExpenses();
    }, []);

    useEffect(() =>{
        if(subscribe) {
            expenseService.subscribe((liveExpenses) => {
                setExpenses(liveExpenses);
                setLastUpdate(utils.to_HHmm());
                setLoading(false);
            }, filter, onError);
        }
    }, []);

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }

    return (
        <div className="card-content">
            <h3
                style={{ marginBottom: "0px" }}
                className={'list-group-header clickable-header'}
                onClick={handleExpand}
            >
                {title}

                <span className="expand-icon">
                    {expand_ ? ' ▼' : ' ▶'}
                </span>
            </h3>
            {expand_ && (<>
                {expenses.map((expense) => {
                    return (
                        <React.Fragment key={expense.id}>
                            <ExpenseComponent 
                                expense={expense} 
                                handleDelete={handleDeleteExpense}
                                context={context}
                            />
                        </React.Fragment>
                    )
                })}
            </>)}
    </div>);
}