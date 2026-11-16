import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as ledgerService from "../services/ledgerService.js";
import { useNotification } from "../context/NotificationContext.js";
import MultipleChoiceList from './MultipleChoiceList.js';
import * as bookingService from "../services/bookingService.js";
import PdfViewer from './PdfViewer.js';

export default function AdminScreen({context}) {
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



    return (
        <div>
            <button onClick={() => ledgerService.closeMonth(onError)}>
                Close month
            </button>

            <button onClick={() => context.onNavigate('add-activity')}>
                New activity menu
            </button>
        </div>
    );
}
