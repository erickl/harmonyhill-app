import React, { useState, useEffect } from 'react';
import * as invoiceService from "../services/invoiceService.js";
import * as userService from "../services/userService.js";
import UploadReceiptScreen from './UploadReceiptScreen.js';
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ButtonsFooter from './ButtonsFooter.js';
import * as utils from "../utils.js";
import "./AddExpenseScreen.css";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import ExpensesScreen from './ExpensesScreen.js';

export default function AddExpensesScreen({ onNavigate }) {

    const emptyForm = {
        photo       : null,
        amount      : '',
        purchasedBy : '',
        purchasedAt : utils.today(),
        category    : '',
        description : '',
        comments    : '',
    };

    const [teamMembers,     setTeamMembers    ] = useState([]   );
    const [readyToSubmit,   setReadyToSubmit  ] = useState(false);
    const [showList,        setShowList       ] = useState(false);
    const [validationError, setValidationError] = useState(null );
    const [errorMessage,    setErrorMessage   ] = useState(null );

    const onValidationError = (error) => {
        setValidationError(error);
    };

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    // State to manage form data
    const [formData, setFormData] = useState(emptyForm);

    // Sample categories for the dropdown
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

    // Function to reset the form to its initial state
    const resetForm = () => {
        setFormData(emptyForm);
    };

    // Handle input changes
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

    const validateFormData = async (newFormData) => {
        const validationResult = await invoiceService.validate(newFormData, onValidationError);

        //setReadyToSubmit(validationResult);
        setReadyToSubmit(true); // todo: for testing

        if(validationResult === true) {
            setValidationError(null);
        }
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        try {
            if(!readyToSubmit) {
                return;
            }

            const fileDate = utils.to_YYMMdd(formData.purchasedAt);
            const fileDescription = formData.description.trim().toLowerCase().replace(/ /g, "-");
            
            const fileName = `${fileDescription}-${fileDate}-${Date.now()}`;
            const thumbNailName = `thumbnails/${fileName}.jpg`;
            const originalName = `receipts/${fileName}.jpg`;

            const thumbNailUrl = await invoiceService.uploadPurchaseInvoice(thumbNailName, formData.photo, {maxSize : 0.02}, onError);
            if(!thumbNailUrl) {
                return;
            }
            
            const photoUrl = await invoiceService.uploadPurchaseInvoice(originalName, formData.photo, {maxSize : 0.1}, onError);
            if(!photoUrl) {
                return;
            }
            
            formData.photoUrl     = photoUrl;
            formData.thumbNailUrl = thumbNailUrl;
            formData.fileName     = fileName;
            
            delete formData['photo'];
            
            const addResult = await invoiceService.addPurchaseInvoice(formData, onError);

            if(addResult) {
                resetForm();
            } else {
                throw new Error("Receipt form data upload error");
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
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
                <UploadReceiptScreen onUploadSuccess={(photo) => handleChange("photo", photo)}/> 
                    
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
