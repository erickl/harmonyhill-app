import { useState, useEffect } from 'react';
import TextInput from "./TextInput.js";
import ButtonsFooter from "./ButtonsFooter.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import * as utils from "../utils.js";

export default function InputModal({onSubmit, onClose}) {
    const emptyForm = { 
        comment : "",
    };

    const [formData, setFormData] = useState(emptyForm);

    const [validationError,   setValidationError  ] = useState(null);
    const [readyToSubmit,     setReadyToSubmit    ] = useState(true);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();

    const handleSubmit = async () => {
        try {
            if(!readyToSubmit) return onError(`Not yet ready to submit. Missing obligatory data`);
            
            const result = await onSubmit(formData);  

            if(result !== false) { 
                setFormData(emptyForm);
                onClose();
                onSuccess();
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    const validateFormData = async (newFormData) => {
        setReadyToSubmit(true);
        // Add validation
        const validationResult = true;
        if(validationResult === true) {
            setValidationError(null);
        }
    }

    const handleChange = (field, value) => {
        let nextFormData = {};

        if (field === "_batch" && typeof value === 'object' && value !== null) {
            nextFormData = { ...formData, ...value };
        }
        else if (field === 'amount') {
            const numericValue = utils.cleanNumeric(value);
            nextFormData = { ...formData, [field]: numericValue };
        } else {
            nextFormData = { ...formData, [field]: value };
        }

        if(!utils.isEmpty(nextFormData)) {
            setFormData(nextFormData);
        }

        validateFormData(nextFormData);
    };

    useEffect(() => {
        // Initial validation
        validateFormData(emptyForm);
    }, []);

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <TextInput
                    type="text"
                    name="comment"
                    label={"Comment"}
                    value={formData.comment}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                />

                {(validationError && <p className="validation-error">{validationError}</p>)}

                <ButtonsFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    submitEnabled={readyToSubmit}
                />
            </div>
        </div>
    );
}