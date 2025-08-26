import { useEffect, useRef } from "react";
import "./ButtonsFooter.css";

export default function ButtonsFooter({onCancel, onSubmit, submitEnabled}) {

    let btnRef = useRef();

    const handleSubmit = async () => {
        // disables instantly to prevent double submits
        btnRef.current.disabled = true; 
        try {
            await onSubmit();
        } finally {
            btnRef.current.disabled = false; 
        }
    }

    return (
        <div className="buttons-footer">
            <button 
                type="button" 
                onClick={() => onCancel(null)} 
                className="cancel-button"
            >
                Back
            </button>
            
            <button 
                type="button" 
                className={ submitEnabled ? "submit-button" : "mute-submit-button" }
                ref={btnRef}
                onClick={ handleSubmit }
                disabled={ !submitEnabled }
            >
                Submit
            </button>
        </div>
    );
}
