import React, { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { pdfjs } from 'react-pdf';
import * as invoicePdfService from "../services/invoicePdfService.js";
import { Share, XIcon } from 'lucide-react';
import "./PdfViewer.css";
import { useNotification } from "../context/NotificationContext.js";
import { WhatsappShareButton, WhatsappIcon } from 'react-share';

import * as storageDao from "../daos/storageDao.js";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfViewer({customer, triggerRerender, onClose }) {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [title, setTitle] = useState(null);

    const { onError } = useNotification();

    useEffect(() => {
        let isMounted = true;
        let dataUrl = null;

        const createPdfDoc = async () => {
            const pdfDoc = await invoicePdfService.make(customer);

            // const pdfLink = await pdf(pdfDoc);
            const pdfContainer = pdf([]); // create a fresh PDF instance
            pdfContainer.updateContainer(pdfDoc);
            const blob = await pdfContainer.toBlob();

            if (!isMounted) return;

            //url = URL.createObjectURL(blob);
            const title = invoicePdfService.makeTitle(customer);
            setTitle(title);
            const filename = `invoices/${title}`;
            const downloadUrl = await storageDao.upload(filename, blob, {}, onError);
            setPdfUrl(downloadUrl);
        };
        createPdfDoc();

        return () => {
            isMounted = false;
            if (dataUrl) URL.revokeObjectURL(dataUrl);
        };
    }, [customer, triggerRerender]);

    const handleShare = async () => {
        if (!pdfUrl) return;

        try {
            // Check if the browser supports native sharing
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: "Here's your generated invoice",
                    url: pdfUrl,
                });
            } else {
                onError("Sharing is not supported on this device.");
            }
        } catch (e) {
            if(e.message.includes("cancellation")) return;
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
                    style={{margin:"0"}}
                    url={pdfUrl}
                    title={`Dear ${customer.name}. Here's your invoice`}
                    separator=" | "
                >
                    <WhatsappIcon size={95} round={true} />
                </WhatsappShareButton>
                <button className="share-button" onClick={() => handleShare()}>
                    <Share className="inner-icon" />
                </button>
                <button className="close-button" onClick={() => onClose()}>
                    <XIcon className="inner-icon" />
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
