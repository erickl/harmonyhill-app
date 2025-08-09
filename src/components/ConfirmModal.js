import {useState} from "react";
import * as utils from "../utils.js";
import Spinner from "./Spinner.js";

export default function ConfirmModal({onCancel, onConfirm}) {

    const [loading, setLoading] = useState(false);
    
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h2>Are you sure?</h2>  
                
                <div className="buttons-footer">
                    <button type="button" onClick={onCancel}>Cancel</button>
                    <button type="button" onClick={() => {
                        setLoading(true);
                        onConfirm();
                    }}>
                        Confirm
                    </button>
                    { loading && <Spinner />} 
                </div>
            </div>
        </div>
    );
}
