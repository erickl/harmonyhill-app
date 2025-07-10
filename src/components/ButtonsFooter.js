import "./ButtonsFooter.css";

export default function ButtonsFooter({onCancel, onSubmit}) {
    return (
        <div className="buttons-footer">
            <button type="button" onClick={() => onCancel(null)} className="cancel-button">
                Back to activities
            </button>
            
            <button 
                type="button" 
                onClick={ () => onSubmit() }
            >
                Submit
            </button>
        </div>
    );
}
