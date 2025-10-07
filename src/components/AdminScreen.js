import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as ledgerService from "../services/ledgerService.js";
import { useNotification } from "../context/NotificationContext.js";

import * as bookingService from "../services/bookingService.js";
import PdfViewer from './PdfViewer.js';

export default function AdminScreen({}) {
    const { onError } = useNotification();

    const [testCustomer, setTestCustomer] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);

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
        </div>
    );
}
