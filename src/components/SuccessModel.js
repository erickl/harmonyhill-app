import {useState, useEffect} from "react";

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
                Success!
            </div>
        </div>
    );
}
