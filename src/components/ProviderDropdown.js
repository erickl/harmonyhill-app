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
    const keys = Object.keys(options);

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(currentName === "" ? null : currentName);
  
    const toggleDropdown = () => setIsOpen(!isOpen);
    
    const handleSelect = (key) => {
        const option = options[key];
        setSelected(key);
        option.price = utils.cleanNumeric(option.price);
        onSelect(option);
        setIsOpen(false);
    };

    useEffect(() => {
        setSelected(currentName);
    }, []); 

    return (
        <div className="provider-container">
            <div className="dropdown-menu">
                <div className="dropdown-row">
                    <button type="button" className="open-button" onClick={toggleDropdown}>
                        ☰
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
        </div>
    );
}
