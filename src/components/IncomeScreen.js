import React, { useState, useEffect } from 'react';
import * as incomeService from "../services/incomeService.js";
import * as bookingService from "../services/bookingService.js";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import * as utils from "../utils.js";
import "./IncomeScreen.css";

export default function IncomeScreen({ onNavigate, onClose }) {

    const [expandedIncomes,  setExpandedIncomes] = useState({}  );
    const [incomes,          setIncomes        ] = useState([]  );
    const [loading,          setLoading        ] = useState(true);
    const [errorMessage,     setErrorMessage   ] = useState(null);

    const handleSetExpandedIncome = async (income) => {
        if(!income) return;

        let updatedExpandedList = { ...(expandedIncomes || {}) };

        const expand = utils.isEmpty(updatedExpandedList[income.id]);

        if(expand) {
            const booking = await bookingService.getOne(income.bookingId);
            income.bookingName = booking.name;
            updatedExpandedList[income.id] = income;
        } else {
            updatedExpandedList[income.id] = null;
        }

        setExpandedIncomes(updatedExpandedList);
    };

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

        fetchIncomes();
    }, []);

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }
     
    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Income</h2>
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
                                    <div className="expand-icon">
                                        {expandedIncomes[income.id] ? '▼' : '▶'}
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.formatDisplayPrice(income.amount, true)}
                                </div>
                                {expandedIncomes[income.id] && (
                                    <div className="income-body">
                                        <div>
                                            Booking: {income.bookingName}
                                        </div>
                                        <div>
                                            Comments: {income.comments}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    )
}
