import React, { useState, useEffect } from 'react';
import "./ActivityForm.css";
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import * as utils from "../utils.js";

export default function ActivityForm({ selectedActivity, formData, handleFormDataChange }) {
    const onProviderSelect = (provider) => {
        const name = provider ? provider.name : '';
        handleFormDataChange("provider", name);
    }

    // Transform object from {"Rena": 500000}  to  {"Rena - Rp 500000": {"name": Rena, "price": 500000}}
    const providers = Object.entries(selectedActivity.providerPrices).reduce((m, activity) => {
        const name = utils.capitalizeWords(activity[0]);
        const price = utils.formatDisplayPrice(activity[1], true);
        m[`${name} - ${price}`] = { "name" : name, "price" : activity[1] };
        return m;
    }, {});

    return (
        <div>
            <h3>Confirm Purchase Details:</h3>
            <form>
                <div className="purchase-form-group">
                    <label htmlFor="purchasePrice">Price:</label>
                    <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                        <span className="currency-prefix">{utils.getCurrency()}</span>
                        <input
                            type="text" // Changed from "number" to "text"
                            id="purchasePrice"
                            name="customerPrice"
                            // Apply formatting here for display inside the input
                            value={utils.formatDisplayPrice(selectedActivity.customerPrice)}
                            onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                            className="input"
                        />
                    </div>
                </div>
                <div className="purchase-form-group">
                    <Dropdown options={providers} onSelect={onProviderSelect}/>
                </div>
                <div className="purchase-form-group">
                    <MyDatePicker name={"startingAt"} value={formData.startingAt} onChange={handleFormDataChange} required/>
                </div>
                <div className="purchase-form-group">
                    <label htmlFor="purchaseComments">Comments:</label>
                    <textarea
                        id="purchaseComments"
                        name="comments"
                        value={formData.comments}
                        onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                        rows="3"
                        className="input"
                    ></textarea>
                </div>
            </form>
        </div>
    );
}
