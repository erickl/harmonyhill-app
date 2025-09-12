import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as incomeService from "../services/incomeService.js";
import * as bookingService from "../services/bookingService.js";
import "./AddIncomeScreen.css";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import IncomeScreen from "./IncomeScreen.js";
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ButtonsFooter from './ButtonsFooter.js';
import SuccessModal from './SuccessModel.js';

export default function AddIncomeScreen({ incomeToEdit, onNavigate, onClose }) {

    if(!onClose) {
        onClose = () => {
            setShowList(true);
        }
    }

    const emptyForm = {
        amount        : incomeToEdit ? incomeToEdit.amount        : '',
        receivedAt    : incomeToEdit ? incomeToEdit.receivedAt    : utils.today(),
        paymentMethod : incomeToEdit ? incomeToEdit.paymentMethod : '', 
        category      : incomeToEdit ? incomeToEdit.category      : '',
        index         : incomeToEdit ? incomeToEdit.index         : '',
        bookingId     : incomeToEdit ? incomeToEdit.bookingId     : '',
        comments      : incomeToEdit ? incomeToEdit.comments      : '',
        description   : incomeToEdit ? incomeToEdit.description   : '',
    };

    const [showList,        setShowList       ] = useState(false    );
    const [readyToSubmit,   setReadyToSubmit  ] = useState(false    );
    const [validationError, setValidationError] = useState(null     );
    const [errorMessage,    setErrorMessage   ] = useState(null     );
    const [bookings,        setBookings       ] = useState([]       );
    const [formData,        setFormData       ] = useState(emptyForm);
    const [showSuccess,     setShowSuccess    ] = useState(false    );

    const onValidationError = (error) => {
        setValidationError(error);
    };

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    const onCategorySelect = (category) => {
        const name = category ? category.name : '';
        handleChange("category", name);
    }

    const onPaymentMethodSelect = (paymentMethod) => {
        const name = paymentMethod ? paymentMethod.name : '';
        handleChange("paymentMethod", name);
    }

    const onBookingSelect = (booking) => {
        const id = booking ? booking[0].id : '';
        handleChange("bookingId", id);
    }

    const validateFormData = async (newFormData) => {
        const validationResult = await incomeService.validate(newFormData, onValidationError);

        setReadyToSubmit(validationResult);

        if(validationResult === true) {
            setValidationError(null);
        }
    }

    const resetForm = () => {
        setFormData(emptyForm);
    };

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
            if(!readyToSubmit) return;

            let result = null;
            if(incomeToEdit) {
                result = await incomeService.update(incomeToEdit.id, formData, onError);
            } else {
                result = await incomeService.add(formData, onError);
            }
           
            if(result) {
                if(incomeToEdit) onClose();
                else resetForm();
                setShowSuccess(true);
            } else {
                throw new Error("Receipt form data upload error");
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    const category = formData.category.trim().toLowerCase();

    let commentsHint = "";
    if(category === "commission") {
        commentsHint = "Please name provider";
    }

    const needsGuestInfo = category === "guest payment" || category === "commission";

    // Initial validation
    useEffect(() => {
        validateFormData(emptyForm);
    }, []);

    useEffect(() => {
        const getBookings = async() => {
            const filter = {"after": utils.today(-30), "before" : utils.today(10)};
            const bookings = await bookingService.get(filter, onError);
            const bookingsByName = utils.groupBy(bookings, (booking) => {
                const house = booking.house === "harmony hill" ? "HH" : "JN";
                return `${utils.to_YYMMdd(booking.checkInAt)} ${house} ${booking.name}`
            });
            setBookings(bookingsByName);
        }
        if(needsGuestInfo && utils.isEmpty(bookings)) {
            getBookings();
        }
    }, [formData]);

    if(showList) {
        return (<IncomeScreen onClose={() => setShowList(false)}/>);
    }

    // todo: put in database
    const categories = {
        'Guest Payment'        : {"name" : "Guest Payment"    },
        'Petty Cash Top Up'    : {"name" : "Petty Cash Top Up"},
        'Commission'           : {"name" : "Commission"       },
        'Other'                : {"name" : "Other"            },
    };

    // todo: put in database
    const paymentMethods = {
        'Cash'        : {"name" : "Cash"    },
        'Transfer'    : {"name" : "Transfer"},
        'AirBnB'      : {"name" : "AirBnB"  },
    };

    return (
         <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Record New Income</h2>
                </div>
            
                <div>
                    {!incomeToEdit && (
                        <button className="add-button" onClick={() => setShowList(true)}>
                            ☰
                        </button>
                    )}
                </div>
            </div>
            <div className="card-content">
                    
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
                        label={"Category"} 
                        options={categories}
                        current={formData.category}
                        onSelect={onCategorySelect}
                    />
                </div>

                {needsGuestInfo && (
                    <div className="purchase-form-group">
                        <Dropdown 
                            label={"Booking"} 
                            options={bookings}
                            current={formData.bookingId}
                            onSelect={onBookingSelect}
                        />
                    </div>
                )}

                <div className="purchase-form-group">
                    <Dropdown 
                        label={"Payment Method"} 
                        options={paymentMethods}
                        current={formData.paymentMethod}
                        onSelect={onPaymentMethodSelect}
                    />
                </div>

                <div className="purchase-form-group">
                    <MyDatePicker 
                        name={"receivedAt"} 
                        date={formData.receivedAt} 
                        onChange={handleChange}
                        time={null}
                        useTime={false}
                    />
                </div>

                {/* Comments Field */}
                <div className="form-group">
                    <label htmlFor="comments">Comments:</label>
                    <textarea
                        id="comments"
                        name="comments"
                        value={formData.comments}
                        placeholder={commentsHint} 
                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                        rows="4"
                        className="input"
                    ></textarea>
                </div>

                {(validationError && <p className="validation-error">{validationError}</p>)}

                <ButtonsFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    submitEnabled={readyToSubmit}
                />

                {showSuccess && (
                    <SuccessModal onClose={() => setShowSuccess(false)} />
                )} 

                {errorMessage && (
                    <ErrorNoticeModal 
                        error={errorMessage}
                        onClose={() => setErrorMessage(null) }
                    />
                )}
            </div>
        </div>
    );
}
