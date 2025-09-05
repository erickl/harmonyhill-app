import React, { useState, useEffect } from 'react';
import * as expenseService from "../services/expenseService.js";
import * as userService from "../services/userService.js";
import UploadReceiptScreen from './UploadReceiptScreen.js';
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ButtonsFooter from './ButtonsFooter.js';
import * as utils from "../utils.js";
import "./AddExpenseScreen.css";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import ExpensesScreen from './ExpensesScreen.js';

export default function AddExpensesScreen({ expenseToEdit, onNavigate, onClose }) {

    const emptyForm = {
        photoUrl      : expenseToEdit ? expenseToEdit.photoUrl      : null,
        amount        : expenseToEdit ? expenseToEdit.amount        : '',
        purchasedBy   : expenseToEdit ? expenseToEdit.purchasedBy   : '',
        purchasedAt   : expenseToEdit ? expenseToEdit.purchasedAt   : utils.today(),
        category      : expenseToEdit ? expenseToEdit.category      : '',
        oaymentMethod : expenseToEdit ? expenseToEdit.oaymentMethod : '',
        description   : expenseToEdit ? expenseToEdit.description   : '',
        comments      : expenseToEdit ? expenseToEdit.comments      : '',
    };

    const [teamMembers,       setTeamMembers      ] = useState([]       );
    const [readyToSubmit,     setReadyToSubmit    ] = useState(false    );
    const [showList,          setShowList         ] = useState(false    );
    const [validationError,   setValidationError  ] = useState(null     );
    const [errorMessage,      setErrorMessage     ] = useState(null     );
    const [formData,          setFormData         ] = useState(emptyForm);
    const [imageResetTrigger, setImageResetTrigger] = useState(0        );

    const onValidationError = (error) => {
        setValidationError(error);
    };

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    // todo: put in database
    const categories = {
        'Food - Daily market'  : {"name" : "Food - Daily market"  },
        'Food - Non-market'    : {"name" : "Food - Non-market"    },
        'Laundry'              : {"name" : "Laundry"              },
        'Pool'                 : {"name" : "Pool"                 },
        'Other villa supplies' : {"name" : "Other villa supplies" },
        'Guest expenses'       : {"name" : "Guest expenses"       },
        'Utilities'            : {"name" : "Utilities"            },
        'Maintenance'          : {"name" : "Maintenance"          },
        'Donations'            : {"name" : "Donations"            },
        'Assets'               : {"name" : "Assets"               },
        'Tax & accounting'     : {"name" : "Tax & accounting"     },
        'Guest refunds'        : {"name" : "Guest refunds"        },
        'Other'                : {"name" : "Other"                },
    };

    // Initial validation
    useEffect(() => {
        validateFormData(emptyForm);
    }, []);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            const teamMembers = await userService.getUsers();
            const formattedTeamMembers = teamMembers.reduce((m, teamMember) => {
                m[teamMember.name] = teamMember;
                return m;
            }, {})
            setTeamMembers(formattedTeamMembers);
        };

        fetchTeamMembers();
    }, []);

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        handleChange("purchasedBy", name);
    }

    const onCategorySelect = (category) => {
        const name = category ? category.name : '';
        handleChange("category", name);
    }

    const onPaymentMethodSelect = (paymentMethod) => {
        const name = paymentMethod ? paymentMethod.name : '';
        handleChange("paymentMethod", name);
    }

    const resetForm = () => {
        setFormData(emptyForm);
        setImageResetTrigger(imageResetTrigger + 1);
    };

    const validateFormData = async (newFormData) => {
        const validationResult = await expenseService.validate(newFormData, onValidationError);

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

    const handleSubmit = async () => {
        try {
            if(!readyToSubmit) {
                onError(`Not yet ready to submit. Missing obligatory data`);
                return;
            }

            // If just editing the expense, the user might not have taken a new photo
            if(formData.photo) {
                const fileDate = utils.to_YYMMdd(formData.purchasedAt);
                const fileDescription = formData.description.trim().toLowerCase().replace(/ /g, "-");
                formData.fileName = `${fileDescription}-${fileDate}-${Date.now()}`;
                formData.fileName = `expenses/${formData.fileName}.jpg`;
                formData.photoUrl = await expenseService.uploadReceipt(formData.fileName, formData.photo, {maxSize : 0.1}, onError);
                delete formData['photo'];
            }
            
            if(!formData.photoUrl) {
                onError(`Unexpected error. Cannot find the photo URL`);
                return;
            }
            
            let result = null;
            
            if(expenseToEdit) {
                result = await expenseService.update(expenseToEdit.id, formData, onError);
            } else {
                result = await expenseService.add(formData, onError);
            }         

            if(result) {
                if(expenseToEdit) onClose();
                else resetForm();
            } else {
                throw new Error("Receipt form data upload error");
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    // todo: put in database
    const paymentMethods = {
        'Cash'        : {"name" : "Cash"    },
        'Transfer'    : {"name" : "Transfer"},
        'AirBnB'      : {"name" : "AirBnB"  },
    };

    if(showList) {
        return (<ExpensesScreen onClose={() => setShowList(false)}/>);
    }

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Record New Expense</h2>
                </div>
            
                <div>
                    <button className="add-button" onClick={() => setShowList(true)}>
                        ☰
                    </button>
                </div>
            </div>
            <div className="card-content">
                <UploadReceiptScreen 
                    current={formData.photoUrl} 
                    onUploadSuccess={(photo) => handleChange("photo", photo)}
                    resetTrigger={imageResetTrigger}
                /> 
                    
                <div className="form-group">
                    <label htmlFor="amount">Amount (IDR):</label>
                    <div className="currency-input-wrapper">
                        <span className="currency-prefix">Rp</span>
                        <input
                            type="text" // Use text to allow manual formatting display, number for numeric input
                            id="amount"
                            name="amount"
                            value={utils.formatDisplayPrice(formData.amount)}
                            onChange={(e) => handleChange(e.target.name, e.target.value)}
                            required
                            className="input"
                            inputMode="numeric" // Optional: for mobile keyboards
                        />
                    </div>
                </div>

                <div className="purchase-form-group">
                    <Dropdown 
                        label={"Payment Method"} 
                        options={paymentMethods}
                        current={formData.paymentMethod}
                        onSelect={onPaymentMethodSelect}
                    />
                </div>

                <div className="purchase-form-group">
                    <Dropdown 
                        current={formData.purchasedBy} 
                        label={"Purchased By"} 
                        options={teamMembers} 
                        onSelect={onTeamMemberSelect}
                    />
                </div>

                <div className="purchase-form-group">
                    <Dropdown 
                        label={"Category"} 
                        options={categories}
                        current={formData.category}
                        onSelect={onCategorySelect}
                    />
                </div>

                <div className="purchase-form-group">
                    <MyDatePicker 
                        name={"purchasedAt"} 
                        date={formData.purchasedAt} 
                        onChange={handleChange}
                        time={null}
                        useTime={false}
                    />
                </div>

                {/* Description Field */}
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                        required
                        className="input"
                    />
                </div>

                {/* Comments Field (Optional) */}
                <div className="form-group">
                    <label htmlFor="comments">Comments (Optional):</label>
                    <textarea
                        id="comments"
                        name="comments"
                        value={formData.comments}
                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                        rows="4"
                        className="input"
                    ></textarea>
                </div>

                {(validationError && <p className="validation-error">{validationError}</p>)}

                <ButtonsFooter
                    onCancel={resetForm}
                    onSubmit={handleSubmit}
                    submitEnabled={readyToSubmit}
                />

                {errorMessage && (
                    <ErrorNoticeModal 
                        error={errorMessage}
                        onClose={() => setErrorMessage(null) }
                    />
                )}
            </div>
        </div>
    );
};
