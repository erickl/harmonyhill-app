import { useEffect } from "react";
import "./ButtonsFooter.css";

export default function ButtonsFooter({onCancel, onSubmit, submitEnabled}) {

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
                onClick={ () => onSubmit() }
                disabled={ !submitEnabled }
            >
                Submit
            </button>
        </div>
    );
}
