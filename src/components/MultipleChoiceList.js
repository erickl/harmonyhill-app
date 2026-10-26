import React, { useState, useEffect } from 'react';
import "./MultipleChoiceList.css";
import * as utils from "../utils.js";

export default function MultipleChoiceList({ label, current, options, onSelect }) {
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        let current_ = current;
        if(utils.isString(current)) {
            current_ = utils.isEmpty(current) ? [] : [current];
        }
        setSelected(current_ || []);
    }, [current]); 

    const handleSelect = (key) => {
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
        <div className="row">
            {Object.values(options).map((option, i) => {
                const index = selected.findIndex(e => e === option);
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

                        {isSelected && (
                            <p className="order">
                                {index+1}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
