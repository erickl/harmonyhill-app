import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as ledgerService from "../services/ledgerService.js";
import { useNotification } from "../context/NotificationContext.js";
import MultipleChoiceList from './MultipleChoiceList.js';
import * as bookingService from "../services/bookingService.js";
import PdfViewer from './PdfViewer.js';

export default function AdminScreen({}) {
    const { onError } = useNotification();

    const [testCustomer, setTestCustomer] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [assigned, setAssigned] = useState([]);

    useEffect(() => {
        const getTestCustomer = async() => {
            const thisTestCustomer = await bookingService.getOne("250916-hh-Diana-Fehling");
            setTestCustomer(thisTestCustomer);
        }
        getTestCustomer();
    }, []);

    if(showInvoice) {
        return (<PdfViewer customer={testCustomer} onClose={() => setShowInvoice(false)}/>);
    }

    const staff = [
        "eric",
        "eline",
        "robert",
        "lucas",
        "veerle",
        "luc",
        "eric",
        "eline",
        "robert",
        "lucas",
        "veerle",
        "luc"
    ];

    const onSelect = (selected) => {
        setAssigned(selected);
    }

    return (
        <div>
            <button onClick={() => ledgerService.closeMonth(onError)}>
                Close month
            </button>

            {testCustomer !== null ? (
                <button onClick={() => setShowInvoice(true)}>
                    Show test invoice
                </button>
            ) : (
                <button disabled={true}>
                    Loading test invoice...
                </button>
            )}

            <MultipleChoiceList 
                label="Assign To"
                current={assigned}
                options={staff}
                onSelect={onSelect}
            />
        </div>
    );
}
