import React, { useState, useEffect, use } from "react";
import { pdf } from "@react-pdf/renderer";
import { pdfjs } from 'react-pdf';
import { Document, Page } from 'react-pdf'; // For viewing the PDF
import InvoicePdf from "./InvoicePdfLink.js";
import * as invoicePdfService from "../services/invoicePdfService.js";
import { Share, XIcon } from 'lucide-react';
import {  Text, View } from "@react-pdf/renderer";
import "./PdfViewer.css";
import { useNotification } from "../context/NotificationContext.js";
import { WhatsappShareButton, WhatsappIcon } from 'react-share';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfViewer({customer, onClose}) {
    const [pdfUrl, setPdfUrl] = useState(null);

    const { onError } = useNotification();

    useEffect(() => {
        let isMounted = true;
        let url = null;

        const createPdfDoc = async () => {
            const pdfDoc = await invoicePdfService.make(customer);

            // const pdfLink = await pdf(pdfDoc);
            const pdfContainer = pdf([]); // create a fresh PDF instance
            pdfContainer.updateContainer(pdfDoc);
            const blob = await pdfContainer.toBlob();

            if (!isMounted) return;

            url = URL.createObjectURL(blob);
            setPdfUrl(url);
        };
        createPdfDoc();

        return () => {
            isMounted = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [customer]);

    const handleShare = async () => {
        if (!pdfUrl) return;

        try {
            // Check if the browser supports native sharing
            if (navigator.share) {
                await navigator.share({
                    title: "Invoice PDF",
                    text: "Here's your generated invoice.",
                    url: pdfUrl,
                });
            } else {
                onError("Sharing is not supported on this device.");
            }
        } catch (e) {
            onError(`Error sharing: ${e.message}`);
        }
    };

    if (!pdfUrl) {
        return <div>Loading PDF...</div>;
    }

    return (
        <div style={{ position: "relative", height: "90vh", width: "100%" }}>
            <div className="share-container">
                <WhatsappShareButton
                    url={pdfUrl}
                    title={"Hello!"}
                    separator=" | "
                >
                    <WhatsappIcon size={90} round={true} />
                </WhatsappShareButton>
                <button className="share-button" onClick={() => handleShare()}>
                    <Share className="h-4 w-4" />
                </button>
                <button className="close-button" onClick={() => onClose()}>
                    <XIcon className="h-4 w-4" />
                </button>
            </div>
            {pdfUrl ? (
                <iframe
                src={pdfUrl}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    borderRadius: "8px",
                }}
                title="PDF Preview"
                />
            ) : (
                <p>Generating PDF...</p>
            )}
        </div>
    );
}
