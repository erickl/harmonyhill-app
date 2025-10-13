import { useEffect, useState } from "react";
import "./ButtonsFooter.css";
import Spinner from "./Spinner.js";

export default function ButtonsFooter({onCancel, onSubmit, submitEnabled }) {

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await onSubmit();
        } finally {
            setLoading(false);
        }
    }

    const disabled = !submitEnabled || loading;

    return (
        <div className="buttons-footer">
            <button 
                type="button" 
                onClick={() => onCancel()} 
                className="cancel-button"
            >
                Back
            </button>
            
            <button 
                type="button" 
                className={ disabled ? "mute-submit-button" : "submit-button" }
                onClick={ handleSubmit }
                disabled={ disabled }
            >
                { loading ? "Processing..." : "Submit" }
            </button>
            { loading && <Spinner />} 
        </div>
    );
}
