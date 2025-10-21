import ButtonsFooter from "./ButtonsFooter.js";

export default function ConfirmModal({message, onCancel, onConfirm}) {
    
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h2>{message ? message : "Are you sure?"}</h2>  
                
                <ButtonsFooter 
                    onCancel={onCancel}
                    onSubmit={onConfirm}
                    submitEnabled={true}
                />
            </div>
        </div>
    );
}
