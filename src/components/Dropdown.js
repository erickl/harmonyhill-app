import React, { useState, useEffect, useRef } from 'react';
import "./Dropdown.css";
import * as utils from "../utils.js";
import TextInput from './TextInput.js';
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
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            setMenuPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
                maxHeight: Math.max(120, Math.min(300, spaceBelow)),
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
            <div className="dropdown-row" onClick={toggleDropdown} ref={buttonRef}>
                <TextInput
                    type="text"
                    label={label}
                    
                    
                    value={utils.capitalizeWords(selected) || 'Select an option'}
                    onChange={null}
                />
            </div>

            {isOpen && createPortal(
                <ul
                    ref={menuRef}
                    className="list"
                    style={{
                        position: 'fixed',
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
