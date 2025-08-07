import React from 'react';
import UploadReceiptScreen from './UploadReceiptScreen';
import * as utils from "../utils";

export default function ExpensesScreen() {
    
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Expenses</h2>
            </div>
            <div className="card-content">
                {/* <UploadReceiptScreen /> 
                    <form>
                    <div className="purchase-form-group">
                        <label htmlFor="purchasePrice">Price:</label>
                        <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                            {/* <span className="currency-prefix">{utils.getCurrency()}</span>
                            <input
                                type="text" // Changed from "number" to "text"
                                id="amount"
                                name="amount"
                                // Apply formatting here for display inside the input
                                value={utils.formatDisplayPrice(0)}
                                onChange={(e) => {}}//handleFormDataChange(e.target.name, e.target.value, "amount")}
                                className="input"
                            />
                        </div>
                    </div>
                </form> */} 
                <p>To be released soon....</p> 
            </div>
        </div>
    );
};
