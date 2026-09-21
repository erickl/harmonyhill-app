import { useState, useEffect } from 'react';
import TextInput from "./TextInput.js";
import ButtonsFooter from "./ButtonsFooter.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import {useUserPermissions} from "../context/UserPermissionsContext.js";
import * as issueService from "../services/issueService.js";
import * as utils from "../utils.js";
import "./IssueModal.css";

export default function IssueModal({onSubmit, record, onClose}) {
    const emptyForm = { 
        comment : "",
        status : "",
    };

    const nextStatus = record.issue === "attention" ? "pending_approval" : "attention";

    const [formData, setFormData] = useState(emptyForm);

    const [validationError,   setValidationError  ] = useState(null);
    const [readyToSubmit,     setReadyToSubmit    ] = useState(true);
    const [comments,          setComments         ] = useState([]);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();
    const { permissions } = useUserPermissions();

    const handleSubmit = async (status) => {
        let result = false;
        try {
            if(!readyToSubmit) return onError(`Not yet ready to submit. Missing obligatory data`);
            
            formData.status = status;
            result = await onSubmit(formData);  

            if(result !== false) { 
                setFormData(emptyForm);
                onClose();
                onSuccess();
            }
            return result;
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }   
        return result;     
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
                <h2>Status: {record.issue ? record.issue : "Normal"}</h2>
                {comments && (
                    <div className="comment-field">
                        {comments.map((comment) => (
                            <div className="comment">
                                <div>
                                    <div className="comment-text" key={`comment-${comment.id}`}> 
                                        {comment.comment}
                                    </div>
                                    <div className="metainfo-left">
                                        {comment.createdBy}, {utils.to_yyMMddHHmm(comment.createdAt, "/")}
                                    </div>
                                </div>
                                <div className="metainfo-right">
                                    {}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
               
                <TextInput
                    className="comment-input"
                    type="text"
                    name="comment"
                    label={"Comment"}
                    value={formData.comment}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                />

                {(validationError && <p className="validation-error">{validationError}</p>)}

                <ButtonsFooter
                    onCancel={onClose}
                    onSubmit={() => handleSubmit(nextStatus)}
                    submitEnabled={readyToSubmit}
                />

                {permissions.isAdmin && (
                    <button
                        onClick={(e) => handleSubmit("resolved")}
                    >
                        Resolve
                    </button>
                )}
            </div>
        </div>
    );
}