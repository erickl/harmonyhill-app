import {useState, useRef} from "react";
import * as utils from "../utils.js";
import * as invoiceService from "../services/invoiceService.js";
import Spinner from "./Spinner.js";
import "./ConfirmOrderModal.css";
import DishesSummaryComponent from "./DishesSummaryComponent.js";

export default function ConfirmOrderModal({selected, onCancel, onConfirm}) {

    const [loading, setLoading] = useState(false);
    
    let btnRef = useRef();

    const handleConfirm = async() => {           
        try {  
            // disables instantly to prevent double submits
            btnRef.current.disabled = true; 
            setLoading(true);
            await onConfirm();
        } finally {
            btnRef.current.disabled = false; 
        }
    }
    
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h2>Confirm Your Order</h2>
                    {/* Display total order thus far */}
                    {!utils.isEmpty(selected) ? (<>
                        <DishesSummaryComponent dishes={selected}/>
                    </>) : null}

                <p>Are you sure you want to submit this order?</p>
                
                <div className="buttons-footer">
                    
                    <button type="button" 
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button 
                        type="button" 
                        disabled={loading} 
                        ref={btnRef}
                        onClick={ handleConfirm }
                    >
                        {loading ? "Processing..." : "Confirm" }
                    </button>

                    { loading && <Spinner />} 
                </div>
            </div>
        </div>
    );
}
