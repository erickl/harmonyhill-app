import React, { useState, useEffect, useRef } from 'react';
import "./Dropdown.css";
import * as utils from "../utils.js";
import { createPortal } from 'react-dom';

export default function Dropdown({ label, current, options, onSelect }) {
    const keys = Object.keys(options);

    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const [selected, setSelected] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const toggleDropdown = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
        setIsOpen(prev => !prev);
    };

    useEffect(() => {
        setSelected(current);
    }, [current]); 

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (buttonRef.current && !buttonRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (key) => {
        const option = options[key];
        setSelected(key);
        onSelect(option);
        setIsOpen(false);
    };

    return (
        <div className="dropdown-menu">
            <div className="dropdown-row">
                <span>{label}</span>
                <button
                    type="button"
                    className="open-button"
                    ref={buttonRef}
                    onClick={toggleDropdown}
                >
                    {utils.capitalizeWords(selected) || 'Select an option'}
                </button>
            </div>

            {isOpen && createPortal(
                <ul
                    ref={menuRef}
                    className="list"
                    style={{
                        position: 'absolute',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        width: menuPosition.width,
                        maxHeight: '300px',
                        overflowY: 'auto',
                    }}
                >
                    {keys.length > 0 ? (
                        keys.map((key) => (
                            <li className="item" key={key} onClick={() => handleSelect(key)}>
                                {utils.capitalizeWords(key)}
                            </li>
                        ))
                    ) : (
                        <li className="item" key="no-options" onClick={() => handleSelect(null)}>
                            No options available
                        </li>
                    )}
                </ul>,
                document.body
            )}
        </div>
    );
}
