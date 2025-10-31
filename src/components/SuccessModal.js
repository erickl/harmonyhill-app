import {useState, useEffect} from "react";
import "./SuccessModal.css";

export default function SuccessModal({message, onClose}) {
    
    useEffect(() => {
        if(message) {
            return; // Give user time to read message
        }

        const timer = setTimeout(() => {
            onClose();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="success-indicator">
                    <div className="circle">
                        ✓
                    </div>
                </div>
                
                {message ? (<>
                    <p>{message}</p>
                    <button onClick={onClose}>OK</button>
                </>) : (
                    <p>Success!</p>
                )}
            </div>
        </div>
    );
}
