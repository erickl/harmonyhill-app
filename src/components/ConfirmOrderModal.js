import * as utils from "../utils.js";
import * as invoiceService from "../services/invoiceService.js";

export default function ConfirmOrderModal({selected, onCancel, onConfirm}) {

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h2>Confirm Your Order</h2>
                    {/* Display total order thus far */}
                    {selected ? (<>
                        <p>You selected:</p>
                        {Object.entries(selected).filter(([_, dishData]) => dishData.quantity > 0).map(([dishName, dishData]) => (
                            <div key={`${dishName}-selected-wrapper`}>
                                <p>
                                    {invoiceService.dishReceiptLine(dishData)}
                                </p>
                            </div>
                        ))}
                    </>) : null}
                <p>Are you sure you want to submit this order?</p>
                <div className="buttons-footer">
                    <button type="button" onClick={onCancel}>Cancel</button>
                    <button type="button" onClick={onConfirm}>Confirm</button>    
                </div>
            </div>
        </div>
    );
}
