import React, { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import * as invoiceService from "../services/invoiceService.js";
import * as invoicePdfService from "../services/invoicePdfService.js";
import * as utils from "../utils.js";
import "./InvoicePdf.css";
import '../assets/fonts.js';

export default function InvoicePdfLink({customer}) {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [total,  setTotal ] = useState(0   );

    useEffect(() => {
        const loadInvoice = async () => {
            if(!customer) return;

            const invoice = await invoiceService.getTotal(customer.id);
            setTotal(invoice.total);

            const pdfDoc = await invoicePdfService.make(customer);
            setPdfDoc(pdfDoc);
        }

        loadInvoice();
    }, []);

    if(!pdfDoc) {
        return (
            <p>Loading invoice...</p>
        )
    }

    const linkName = `Total: ${utils.formatDisplayPrice(total, true)}`
    const filename = invoicePdfService.makeTitle(customer);

    return (
        <div>
            <PDFDownloadLink document={pdfDoc} fileName={filename}>
                {linkName}
            </PDFDownloadLink>
        </div>
    )
};
