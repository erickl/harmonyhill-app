import {useState} from "react";
import * as utils from "../utils.js";
import Spinner from "./Spinner.js";

export default function ConfirmModal({message, onCancel, onConfirm}) {

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await onConfirm();
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h2>{message ? message : "Are you sure?"}</h2>  
                
                <div className="buttons-footer">
                    <button type="button" onClick={onCancel}>Cancel</button>
                    <button 
                        type="button" 
                        onClick={handleSubmit}
                    >
                        { loading ? "Processing..." : "Confirm" }
                    </button>
                    { loading && <Spinner />} 
                </div>
            </div>
        </div>
    );
}
