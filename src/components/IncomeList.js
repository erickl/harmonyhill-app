
import React, { useEffect, useState } from "react";
import * as incomeService from "../services/incomeService.js";
import * as utils from "../utils.js";
import "./IncomeList.css";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import IncomeComponent from "./IncomeComponent.js";
    
export default function IncomeList({context, title, filter, expand, subscribe}) {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [expand_, setExpand] = useState(expand || false);

    const {onError} = useNotification();
    const {onSuccess} = useSuccessNotification();
    const {onConfirm} = useConfirmationModal();

    const handleExpand = () => {
        if(expand_ === false && !subscribe) {
            fetchIncomes();
        }
        setExpand(prev => !prev);
    }
    
    const handleDeleteIncome = async(incomeToDelete) => {
        if(!incomeToDelete || utils.isEmpty(incomeToDelete.id)) return;
        
        onConfirm(`Are you sure you want to delete income ${incomeToDelete.id}?`, async () => {
            const result = await incomeService.remove(incomeToDelete.id, onError);
            if(result !== false) {
                if(subscribe) return;
                let newIncomes = utils.deepCopy(incomes);
                newIncomes = newIncomes.filter((income) => income.id !== incomeToDelete.id);
                setIncomes(newIncomes);
                onSuccess();
            }
        });
    }

    const fetchIncomes = async() => {
        setLoading(prev => !prev);
        const uploadedIncomes = await incomeService.get(filter, onError);
        setIncomes(uploadedIncomes);
        setLoading(prev => !prev);
    }

    useEffect(() => {
        if(!subscribe) fetchIncomes();
    }, []);

    useEffect(() =>{
        if(subscribe) {
            incomeService.subscribe((liveIncomes) => {
                liveIncomes.sort((e1, e2) => e2.receivedAt - e1.receivedAt);
                setIncomes(liveIncomes);
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
                style={{ marginBottom: "0.5rem" }}
                className={'list-group-header clickable-header'}
                onClick={handleExpand}
            >
                {title}

                <div className='list-group-header-right'>
                    {lastUpdate && (<>
                        {subscribe && (
                            <span className='subscription-notification'>•</span>
                        )}
                        <div className='last-updated-info'>
                            Last updated {lastUpdate}
                        </div>
                    </>)}
                    <span className="expand-icon">
                        {expand_ ? ' ▼' : ' ▶'}
                    </span>
                </div>
            </h3>
            {expand_ && (<>
                {incomes.map((income) => {
                    return (
                        <React.Fragment key={income.id}>
                            <IncomeComponent 
                                income={income} 
                                handleDelete={handleDeleteIncome}
                                context={context}
                            />
                        </React.Fragment>
                    )
                })}
            </>)}
    </div>);
}