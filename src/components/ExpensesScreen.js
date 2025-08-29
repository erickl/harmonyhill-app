import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import * as utils from "../utils.js";
import "./ExpensesScreen.css";

export default function ExpensesScreen({ onNavigate, onClose }) {

    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    useEffect(() => {
        const fetchReceipts = async() => {
            const filter = {};
            const uploadedReceipts = await invoiceService.getPurchaseInvoices(filter, onError);
            setReceipts(uploadedReceipts);
            setLoading(false);
        }

        fetchReceipts();
    });

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }
     
    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Expenses</h2>
                </div>
            
                <div>
                    <button className="add-button" onClick={() => onClose()}>
                        +
                    </button>
                </div>
            </div>
            <div>
                {receipts.map((receipt) => {
                    return (
                        <React.Fragment key={receipt.id}>
                            <div className="receipt-box">
                                <div className="title">
                                    {receipt.description}
                                </div>
                                <div>
                                    {utils.formatDisplayPrice(receipt.amount, true)}
                                </div>
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
