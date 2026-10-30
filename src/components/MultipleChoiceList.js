import React, { useState, useEffect } from 'react';
import "./MultipleChoiceList.css";
import * as utils from "../utils.js";

export default function MultipleChoiceList({ label, current, options, maxSelect = Number.MAX_SAFE_INTEGER, onSelect }) {
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        let current_ = current;

        if(utils.isEmpty(current)) current_ = [];
        
        if(utils.isString(current)) {
            current_ = utils.isEmpty(current) ? [] : [current];
        }
        
        current_ = current_.filter((item) => !utils.isEmpty(item));

        setSelected(current_ || []);
    }, [current]); 

    const handleSelect = (key) => {
        // If only 1 is allowed, it makes sense to switch the selected
        if(maxSelect == 1 && selected.length === 1) {
            if(selected[0] === key) key = [];
            else key = [key];
            setSelected(key);
            onSelect(key);
            return;
        }

        // ...But if mulitple is allowed, don't allow to select anymore
        if(selected.length + 1 > maxSelect) {
            return;
        }

        let newSelected = [];
        if(Array.isArray(selected) && selected.includes(key)) {
            newSelected = selected.filter((item) => item !== key);
        } else {
            newSelected = [...(selected || []), key];
        }
       
        setSelected(newSelected);
        onSelect(newSelected);
    };

    return (
        <div>
            <span>{label}</span>
            <div className="row">
                {Object.values(options).map((option, i) => {
                    let index = -1;
                    if(Array.isArray(selected)) {
                        index = selected.findIndex(e => e === option);
                    } else {
                        index = selected === option ? 0 : -1;
                    }
                    
                    const isSelected = index !== -1;
                    return (
                        <div 
                            className='choice'
                            key={`button-${i}`}>
                            <button 
                                className={`option ${isSelected ? 'selected' : ''}`}
                                onClick={(e) => handleSelect(option)}
                            >
                                {option}
                            </button>

                            {isSelected && maxSelect > 1 && (
                                <p className="order">
                                    {index+1}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
