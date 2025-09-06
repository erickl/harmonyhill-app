import {useState, useEffect} from "react";
import "./SuccessModal.css";

export default function SuccessModal({onClose}) {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box">
                <div className="success-indicator">
                    <div className="circle">
                        ✓
                    </div>
                </div>
                <p>Success!</p>
            </div>
        </div>
    );
}
