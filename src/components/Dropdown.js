import React, { useState } from 'react';
import "./Dropdown.css";

/**
 * @param {*} options: A JSON object. The keys are displayed in the drop down list, and the value
 *                     is set as a parameter to onSelect
 * @param {*} onSelect: The callback to call with the selected option
 * @returns the dropdown view including the label on the side
 */
function Dropdown({ label, options, onSelect }) {
    const keys = Object.keys(options);

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(null);
  
    const toggleDropdown = () => setIsOpen(!isOpen);
    const handleSelect = (key) => {
        const option = options[key];
        setSelected(key);
        onSelect(option);
        setIsOpen(false);
    };

    return (
      <div className="dropdown-menu">
        <div className="dropdown-row">
            <p>{label}</p>
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
                    <li className="item" key="no-providers" onClick={() => handleSelect(null)}>
                        No providers found
                    </li>
                )}
            </ul>
        )}
      </div>
    );
}

export default Dropdown;
