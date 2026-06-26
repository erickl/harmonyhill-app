import { useState, useEffect } from 'react';
import TextInput from "./TextInput.js";
import ButtonsFooter from "./ButtonsFooter.js";
import * as todoService from "../services/todoService.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import MyDatePicker from "./MyDatePicker.js";
import * as utils from "../utils.js";

export default function AddTodoModal({todoToEdit, parent, onCreated, onNavigate, onClose}) {
    const emptyForm = { 
        title      : todoToEdit ? todoToEdit.title : "",
        deadlineAt : todoToEdit ? todoToEdit.deadlineAt : null,
        duration   : todoToEdit ? todoToEdit.deadlineAt : null,
    };

    const [formData, setFormData] = useState(emptyForm);

    const [validationError,   setValidationError  ] = useState(null);
    const [readyToSubmit,     setReadyToSubmit    ] = useState(false);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();

    const handleSubmit = async () => {
        try {
            if(!readyToSubmit) return onError(`Not yet ready to submit. Missing obligatory data`);
            
            let result = false;
            
            if(todoToEdit) {
                result = await todoService.update(todoToEdit, formData, onError);
            } else {
                result = await todoService.add(formData, parent, onError);
            }         

            if(result !== false) { 
                onCreated(result);
                setFormData(emptyForm);
                onClose();
                onSuccess();
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    const validateFormData = async (newFormData) => {
        const validationResult = await todoService.validate(newFormData, setValidationError);

        setReadyToSubmit(validationResult);

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

    // Here the AddTodoForm should be
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <TextInput
                    type="text"
                    name="title"
                    label={"Title"}
                    value={formData.title}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                />

                <MyDatePicker 
                    name={"deadlineAt"} 
                    label={"Deadline"}
                    date={formData.deadlineAt} 
                    onChange={handleChange}
                    time={null}
                    useTime={false}
                />

                <TextInput
                    type="amount"
                    name="duration"
                    label={"Duration (minutes)"}
                    value={formData.duration}
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