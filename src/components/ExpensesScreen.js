import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import * as utils from "../utils.js";
import "./ExpensesScreen.css";
import invoiceLogo from "../assets/invoice-icon.png";

export default function ExpensesScreen({ onNavigate, onClose }) {

    const [expandedReceipts, setExpandedReceipts] = useState({});
    const [receipts,         setReceipts        ] = useState([]);
    const [displayedReceipt, setDisplayedReceipt] = useState(null);
    const [loading,          setLoading         ] = useState(true);
    const [errorMessage,     setErrorMessage    ] = useState(null);

    const handleSetExpandedReceipt = (id) => {
        let updatedExpandedList = { ...(expandedReceipts || {}) };
        updatedExpandedList[id] = updatedExpandedList[id] === true ? false : true;
        setExpandedReceipts(updatedExpandedList);
    };

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
                            <div className="receipt-box" onClick={()=> handleSetExpandedReceipt(receipt.id)}>
                                <div className="receipt-header">
                                    <div className="receipt-header-left">
                                        <img 
                                            className="receipt-thumbnail" 
                                            //src={receipt.thumbNailUrl} 
                                            src={invoiceLogo} 
                                            alt={`preview-${receipt.id}`} 
                                            onClick={() => setDisplayedReceipt(receipt)}
                                        />
                                        
                                        <div className="receipt-title">
                                            {utils.capitalizeWords(receipt.description)}
                                        </div>
                                    </div>
                                    <div className="expand-icon">
                                        {expandedReceipts[receipt.id] ? '▼' : '▶'}
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.formatDisplayPrice(receipt.amount, true)}
                                </div>
                                {expandedReceipts[receipt.id] && (
                                    <div className="receipt-body">
                                        <div>
                                            Comments: {receipt.comments}
                                        </div>
                                        <div>
                                            Purchased By: {utils.capitalizeWords(receipt.purchasedBy)}
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

            {displayedReceipt && (
                <img 
                    className="receipt-photo" 
                    src={displayedReceipt.photoUrl} 
                    alt={`receipt-${displayedReceipt.id}`} 
                    onClick={() => setDisplayedReceipt(null)}
                />
            )}
        </div>
    )
}
