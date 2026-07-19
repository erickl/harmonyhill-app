import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as incomeService from "../services/incomeService.js";
import * as bookingService from "../services/bookingService.js";
import * as activityService from "../services/activityService.js";
import "./AddIncomeScreen.css";
import { useNotification } from "../context/NotificationContext.js";
import IncomeScreen from "./IncomeScreen.js";
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ButtonsFooter from './ButtonsFooter.js';
import TextInput from './TextInput.js';
import { useSuccessNotification } from "../context/SuccessContext.js";

export default function AddIncomeScreen({ customer, incomeToEdit, context }) {
    let bookingId = '';
    let category = '';
    if(incomeToEdit) {
        bookingId = incomeToEdit.bookingId;
        category = incomeToEdit.category;
    } else if(customer) {
        category = "Guest Payment";
        bookingId = customer.id;
    }

    const emptyForm = {
        amount        : incomeToEdit ? incomeToEdit.amount        : '',
        receivedAt    : incomeToEdit ? incomeToEdit.receivedAt    : utils.today(),
        paymentMethod : incomeToEdit ? incomeToEdit.paymentMethod : '', 
        category      : category,
        index         : incomeToEdit ? incomeToEdit.index         : '',
        bookingId     : bookingId,
        activityId    : incomeToEdit ? incomeToEdit.activityId    : '',
        comments      : incomeToEdit ? incomeToEdit.comments      : '',
        description   : incomeToEdit ? incomeToEdit.description   : '',
    };

    const [readyToSubmit,   setReadyToSubmit  ] = useState(false    );
    const [validationError, setValidationError] = useState(null     );
    const [bookings,        setBookings       ] = useState([]       );
    const [formData,        setFormData       ] = useState(emptyForm);
    const [activities,      setActivities     ] = useState([]       );
    const [selectedBooking, setSelectedBooking] = useState(null     );
    const [selectedActivity,setSelectedActivity] = useState(null    );
 
    const needsGuestInfo = (formDataCategory) => {
        const category = formDataCategory.trim().toLowerCase();
        return category === "guest payment" || category === "commission";
    }

    const needsActivityInfo = (formDataCategory) => { 
        if(customer) return false;

        const category = formDataCategory.trim().toLowerCase();
        return category === "guest payment" || category === "commission";
    }

    const onValidationError = (error) => {
        setValidationError(error);
    };

    const { onError } = useNotification();
    const {onSuccess} = useSuccessNotification();

    const onCategorySelect = (category) => {
        const name = category ? category.name : '';
        const change = {
            "category": name,
        }

        if(!needsGuestInfo(name)) {
            change["bookingId"] = null;
            setSelectedBooking(null);
            setSelectedActivity(null);
        } else {
            getBookings();
        }
        if(!needsActivityInfo(name)) {
            change["activityId"] = null;
            setSelectedActivity(null);
        }

        handleChange("_batch", change);
    }

    const onActivitySelect = (activities) => {
        const activity = activities ? activities[0] : null;
        handleChange("activityId", activity?.id);
        setSelectedActivity(activity);
    }

    const onPaymentMethodSelect = (paymentMethod) => {
        const name = paymentMethod ? paymentMethod.name : '';
        handleChange("paymentMethod", name);
    }

    const onBookingSelect = (bookings) => {
        const booking = bookings ? bookings[0] : null;
        setSelectedBooking(booking);
        setSelectedActivity(null);
        handleChange("_batch", {
            "bookingId"  : booking?.id,
            "activityId" : null
        });

        if(needsActivityInfo(formData.category)) {
            getBookingActivities(booking);
        }
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

            let result = false;
            if(incomeToEdit) {
                result = await incomeService.update(incomeToEdit.id, formData, onError);
            } else {
                result = await incomeService.add(formData, onError);
            }
           
            if(result !== false) {
                if(incomeToEdit) context.onClose();
                else resetForm();
                onSuccess();
            } else {
                throw new Error("Receipt form data upload error");
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    let commentsHint = "";
    if(formData.category.trim().toLowerCase() === "commission") {
        commentsHint = "Please name provider";
    }

    const getBookings = async() => {
        const filter = {"after": utils.today(-30), "before" : utils.today(10)};
        const bookings = await bookingService.get(filter, onError);
        const bookingsByName = utils.groupBy(bookings, (booking) => {
            const house = booking.house === "harmony hill" ? "HH" : "JN";
            return `${utils.to_YYMMdd(booking.checkInAt)} ${house} ${booking.name}`
        });
        setBookings(bookingsByName);
    }

    const getBookingActivities = async(booking) => {
        const bookingActivities = await activityService.get(booking, {}, onError);
        const activitiesByName = utils.groupBy(bookingActivities, (activity) => {
            return `${utils.to_YYMMdd(activity.startingAt)} ${activity.displayName}`
        });
        setActivities(activitiesByName);
    };

    // Initial validation
    useEffect(() => {
        validateFormData(emptyForm);
    }, []);

    // todo: put in database
    const categories = {
        'Guest Payment'        : {"name" : "Guest Payment"    },
        'Petty Cash Top Up'    : {"name" : "Petty Cash Top Up"},
        'Commission'           : {"name" : "Commission"       },
        'Other'                : {"name" : "Other"            },
    };

    // todo: put in database
    const paymentMethods = {
        'Cash'        : {"name" : "Cash"        },
        'Transfer'    : {"name" : "Transfer"    },
        'AirBnB'      : {"name" : "AirBnB"      },
        'Booking.com' : {"name" : "Booking.com" },
    };

    const incomeFromText = customer ? `: ${customer.name}` : "";

    return (
         <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Record New Income {incomeFromText}</h2>
                </div>
            
                <div>
                    {!incomeToEdit && (
                        <button className="add-button" onClick={() => context.onClose()}>
                            ☰
                        </button>
                    )}
                </div>
            </div>
            <div className="card-content">     
                <TextInput
                    type="amount"
                    name="amount"
                    label={"Amount"}
                    value={formData.amount}
                    onChange={(e) => handleChange(e.target.name, e.target.value, "amount")}
                />

                {/* If there's a customer input, this is a guest payment. No need to select another type */}
                {utils.isEmpty(customer) && (
                    <div className="purchase-form-group">
                        <Dropdown 
                            label={"Category"} 
                            options={categories}
                            current={formData.category}
                            onSelect={onCategorySelect}
                        />
                    </div>
                )}

                {/* If there's a customer input, this is a payment for that specific guest. No need to select another */}
                {utils.isEmpty(customer) && needsGuestInfo(formData.category) && (
                    <div className="purchase-form-group">
                        <Dropdown 
                            label={"Booking"} 
                            options={bookings}
                            current={formData.bookingId}
                            onSelect={onBookingSelect}
                        />
                    </div>
                )}

                {utils.isEmpty(customer) && needsActivityInfo(formData.category) && !utils.isEmpty(formData.bookingId) && (
                    <div className="purchase-form-group">
                        <Dropdown 
                            label={"Activity"} 
                            options={activities}
                            current={formData.activityId}
                            onSelect={onActivitySelect}
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

                <MyDatePicker 
                    name={"receivedAt"}
                    label="Payment"
                    date={formData.receivedAt} 
                    onChange={handleChange}
                    time={null}
                    useTime={false}
                />

                <TextInput
                    type="text"
                    name="comments"
                    label={"Comments"}
                    value={formData.comments}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                />

                {(validationError && <p className="validation-error">{validationError}</p>)}

                <ButtonsFooter
                    onCancel={context.onClose}
                    onSubmit={handleSubmit}
                    submitEnabled={readyToSubmit}
                /> 
            </div>
        </div>
    );
}
