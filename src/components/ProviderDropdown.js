import React, { useState, useEffect } from 'react';
import "./Dropdown.css";
import * as utils from "../utils.js";

/**
 * @param {*} options: A JSON object. The keys are displayed in the drop down list, and the value
 *                     is set as a parameter to onSelect
 * @param {*} onSelect: The callback to call with the selected option
 * @returns the dropdown view including the label on the side
 */
export default function ProviderDropdown({ label, options, currentName, currentPrice, onSelect }) {
    options["Other"] = { "name" : "", "price" : 0 };
    if(!utils.isEmpty(currentName) && currentName.startsWith("Other")) {
        options["Other"].name = currentName.replace(/Other: /, "");
        options["Other"].price = currentPrice;
    }
    
    const keys = Object.keys(options);

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(currentName === "" ? null : currentName);
  
    const toggleDropdown = () => setIsOpen(!isOpen);
    
    const handleSelect = (key) => {
        const option = options[key];
        setSelected(key);
        if(key === "Other") {
            option.name = `Other: ${option.name}`;
        }
        option.price = utils.cleanNumeric(option.price);
        onSelect(option);
        setIsOpen(false);
    };

    useEffect(() => {
        if(!utils.isEmpty(currentName) && currentName.startsWith("Other")) {
            setSelected("Other");
        } else {
            setSelected(currentName);
        }
    }, []); 

    return (
        <div className="provider-container">
            <div className="dropdown-menu">
                <div className="dropdown-row">
                    <span>{label}</span>
                    <button type="button" className="open-button" onClick={toggleDropdown}>
                        {selected || 'Select an option'}
                    </button>
                </div>
                {isOpen && (
                    <ul className="list">
                        {keys.length > 0 ? (
                            keys.map((key) => (
                                <li className="item" key={key} onClick={() => handleSelect(key)}>
                                    {key}
                                </li>
                            ))
                        ) : (
                            <li className="item" key="no-options" onClick={() => handleSelect(null)}>
                                No options available
                            </li>
                        )}
                    </ul>
                )}
            </div>
            {selected === "Other" && (
                <>
                    <div>
                        <label htmlFor="provider">Other Provider:</label>
                        <div className="provider-input-wrapper">
                            <input
                                type="text"
                                id="other-provider"
                                name="provider"
                                // Apply formatting here for display inside the input
                                value={options["Other"].name}
                                onChange={(e) => {
                                    options["Other"].name = `${e.target.value}`;
                                    handleSelect("Other")}
                                }
                                className="input"
                            />
                        </div>
                    </div>
                    <div className="purchase-form-group">
                        <label htmlFor="purchasePrice">Provider Price:</label>
                        <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                            <span className="currency-prefix">{utils.getCurrency()}</span>
                            <input
                                type="text" // Changed from "number" to "text"
                                id="purchasePrice"
                                name="customerPrice"
                                // Apply formatting here for display inside the input
                                value={utils.formatDisplayPrice(options["Other"].price)}
                                onChange={(e) => {
                                    options["Other"].price = e.target.value;
                                    handleSelect("Other")}
                                }
                                className="input"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
