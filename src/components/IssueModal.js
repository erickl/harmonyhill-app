import { useState, useEffect } from 'react';
import TextInput from "./TextInput.js";
import ButtonsFooter from "./ButtonsFooter.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import * as issueService from "../services/issueService.js";
import * as utils from "../utils.js";
import "./IssueModal.css";

export default function IssueModal({onSubmit, record, onClose}) {
    const emptyForm = { 
        comment : "",
    };

    const [formData, setFormData] = useState(emptyForm);

    const [validationError,   setValidationError  ] = useState(null);
    const [readyToSubmit,     setReadyToSubmit    ] = useState(true);
    const [comments,          setComments         ] = useState([]);

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
        
        const loadComments = async () => {
            const comments = await issueService.getComments(record);
            setComments(comments);
        }

        loadComments();
    }, []);

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                {comments && (
                    <div className="comment-field">
                        {comments.map((comment) => (
                            <div className="comment">
                                <div>
                                    <div className="comment-text" key={`comment-${comment.id}`}> 
                                        {comment.comment}
                                    </div>
                                    <div className="commenter">
                                        {comment.createdBy}
                                    </div>
                                </div>
                                <div className="comment-timestamp">
                                    {utils.to_yyMMddHHmm(comment.createdAt, "/")}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
               
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