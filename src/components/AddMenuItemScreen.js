import { useState, useEffect } from 'react';
import TextInput from './TextInput.js';
import * as utils from "../utils.js";
import * as menuService from "../services/menuService.js";
import { useSuccessNotification } from '../context/SuccessContext.js';
import { useNotification } from '../context/NotificationContext.js';
import ButtonsFooter from "./ButtonsFooter.js";
import { Checkbox, FormControlLabel } from '@mui/material';

export default function AddMenuItemScreen({context, itemToEdit}) {

    const initalForm = {
        name          : itemToEdit ? itemToEdit.name : "",
        customerPrice : itemToEdit ? itemToEdit.customerPrice : 0,
        course        : itemToEdit ? itemToEdit.course : "",
        description   : itemToEdit ? itemToEdit.description : "",
        instructions  : itemToEdit ? itemToEdit.instructions : "",
        isAvailable   : itemToEdit ? itemToEdit.isAvailable : true,
        isFavorite    : itemToEdit ? itemToEdit.isFavorite : false,
    };

    const [readyToSubmit, setReadyToSubmit] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [validationWarning, setValidationWarning] = useState(null);

    const {onSuccess} = useSuccessNotification();
    const {onError} = useNotification();

    const [formData, setFormData] = useState(initalForm);

    const validateFormData = (newFormData) => {
        if(!itemToEdit) return;
        const validationResult = menuService.validate(newFormData, setValidationError, setValidationWarning);
        setReadyToSubmit(validationResult);
    }

    const handleFormDataChange = (name, value, type) => {
        context.setHasUnsavedChanges(true);
        
        let nextFormData = {};

        if (name === "_batch" && typeof value === 'object' && value !== null) {
            nextFormData = ({ ...formData, ...value });
        }
        // Special handling for price to ensure it's a number
        // Special handling for price: Convert to number after removing non-digit characters
        else if (type === 'amount') {
            nextFormData = { ...formData, [name]: utils.cleanNumeric(value) };
        } else {
            nextFormData = { ...formData, [name]: value };  
        }
        if(!utils.isEmpty(nextFormData)) {
            setFormData(nextFormData);
        }
        
        validateFormData(nextFormData);
    };

    const handleSubmit = async () => {
        try {
            if(!readyToSubmit) return onError(`Not yet ready to submit. Missing obligatory data`);
            
            let result = false;
            
            if(itemToEdit) {
                result = await menuService.update(formData, onError);
            } else {
                result = await menuService.add(formData, onError);
            }         

            if(result !== false) {
                if(itemToEdit) context.onClose();
                else setFormData(initalForm);                
                onSuccess();
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    return (
        <div className='card-content'>
            <h3>Menu Item Details</h3>

            <TextInput 
                type="text"
                name="name"
                label={"Name"}
                value={formData.name}
                onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
            />

            <TextInput 
                type="text"
                name="description"
                label={"Description"}
                value={formData.description}
                onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
            />

            <TextInput 
                type="text"
                name="instructions"
                label={"Instructions"}
                value={formData.instructions}
                onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
            />

            <FormControlLabel
                sx={{ display: 'flex', width: '100%', mt: 2 }}
                control={
                    <Checkbox
                        checked={formData["isAvailable"]}
                        onChange={(e) => handleFormDataChange("isAvailable", e.target.checked)}
                    />
                }
                label="Is available"
            />

            <FormControlLabel
                sx={{ display: 'flex', width: '100%', mt: 2 }}
                control={
                    <Checkbox
                        checked={formData["isFavorite"]}
                        onChange={(e) => handleFormDataChange("isFavorite", e.target.checked)}
                    />
                }
                label="Is favorite?"
            />

            {(validationWarning && <p className="validation-warning">{`Warning: ${validationWarning}`}</p>)}
            {(validationError && <p className="validation-error">{`Error: ${validationError}`}</p>)}
            
            <ButtonsFooter 
                onCancel={context.onClose}
                onSubmit={handleSubmit}
                submitEnabled={readyToSubmit}
            />
        </div>
    );
}