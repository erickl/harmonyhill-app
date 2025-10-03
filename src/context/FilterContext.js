import React, { createContext, useState, useContext } from "react";
import * as utils from "../utils.js";
import MyDatePicker from "../components/MyDatePicker.js";
import TextInput from "../components/TextInput.js";
import ButtonsFooter from "../components/ButtonsFooter.js";

const FilterContext = createContext();

export function FilterProvider({ children }) {
    const [showPopup, setShowPopup] = useState(false);
    const [filters, setFilters] = useState({});
    const [values, setValues] = useState({});
    const [onSubmitFilters, setOnSubmitFilters] = useState(null);

    const onFilter = (filters, onSubmitFiltersCallback) => {
        setShowPopup(true);
        setFilters(filters);
        setOnSubmitFilters(() => onSubmitFiltersCallback);
    } 
    
    const hidePopup = () => {
        setShowPopup(false);
    }

    const handleInputChange = (name, value) => {
        let newValues = { ...values, [name]: value };
        setValues(newValues);
    };

    return (
        <FilterContext.Provider value={{ onFilter }}>
            {children}
            {showPopup && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Filters</h2>
                        
                        {Object.entries(filters).map(([name, type]) => {
                            return (
                                <React.Fragment key={`filter-${name}`}>
                                    {type === "date" ? (
                                        <MyDatePicker 
                                            name={name} 
                                            date={values[name]} 
                                            onChange={handleInputChange}
                                            useTime={false}
                                        />
                                    ) : type === "string" ? (
                                        <TextInput 
                                            type="text"
                                            name={name}
                                            label={utils.capitalizeWords(name)}
                                            value={values[name]}
                                            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                        />
                                    ) : (<div><p>Hello</p></div>)}  
                                </React.Fragment>
                            );
                        })}
                        <ButtonsFooter submitEnabled={true} onCancel={hidePopup} onSubmit={() => onSubmitFilters(values)} />
                    </div>
                </div>
            )}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    return useContext(FilterContext);
}
