import React, { useState, useEffect } from 'react';
import * as expenseService from "../services/expenseService.js";
import * as userService from "../services/userService.js";
import * as bookingService from "../services/bookingService.js";
import * as activityService from "../services/activityService.js";
import UploadReceiptScreen from './UploadReceiptScreen.js';
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ButtonsFooter from './ButtonsFooter.js';
import * as utils from "../utils.js";
import "./AddExpenseScreen.css";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import ExpensesScreen from './ExpensesScreen.js';
import SuccessModal from './SuccessModel.js';

export default function AddExpensesScreen({ expenseToEdit, onNavigate, onClose }) {

    if(!onClose) {
        onClose = () => {
            setShowList(true);
        }
    }

    const emptyForm = {
        photoUrl      : expenseToEdit ? expenseToEdit.photoUrl      : null,
        amount        : expenseToEdit ? expenseToEdit.amount        : '',
        purchasedBy   : expenseToEdit ? expenseToEdit.purchasedBy   : '',
        purchasedAt   : expenseToEdit ? expenseToEdit.purchasedAt   : utils.today(),
        category      : expenseToEdit ? expenseToEdit.category      : '',
        index         : expenseToEdit ? expenseToEdit.index         : '',
        activityId    : expenseToEdit ? expenseToEdit.activityId    : '',
        bookingId     : expenseToEdit ? expenseToEdit.bookingId     : '',
        paymentMethod : expenseToEdit ? expenseToEdit.paymentMethod : '',
        description   : expenseToEdit ? expenseToEdit.description   : '',
        comments      : expenseToEdit ? expenseToEdit.comments      : '',
    };

    const [bookings,          setBookings         ] = useState([]       );
    const [activities,        setActivities       ] = useState([]       );
    const [teamMembers,       setTeamMembers      ] = useState([]       );
    const [readyToSubmit,     setReadyToSubmit    ] = useState(false    );
    const [showList,          setShowList         ] = useState(false    );
    const [validationError,   setValidationError  ] = useState(null     );
    const [errorMessage,      setErrorMessage     ] = useState(null     );
    const [formData,          setFormData         ] = useState(emptyForm);
    const [imageResetTrigger, setImageResetTrigger] = useState(0        );
    const [showSuccess,       setShowSuccess      ] = useState(false    );
    const [isAdmin,           setIsAdmin          ] = useState(false    );

    const onValidationError = (error) => {
        setValidationError(error);
    };

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    };

    // todo: put in database
    const categories = {
        'Food - Daily Market'  : {"name" : "Food - Daily Market"  },
        'Food - Non-Market'    : {"name" : "Food - Non-Market"    },
        'Laundry'              : {"name" : "Laundry"              },
        'Pool'                 : {"name" : "Pool"                 },
        'Other Villa Supplies' : {"name" : "Other Villa Supplies" },
        'Guest Expenses'       : {"name" : "Guest Expenses"       },
        'Utilities'            : {"name" : "Utilities"            },
        'Maintenance'          : {"name" : "Maintenance"          },
        'Donations'            : {"name" : "Donations"            },
        'Assets'               : {"name" : "Assets"               },
        'Tax & Accounting'     : {"name" : "Tax & Accounting"     },
        'Guest Refunds'        : {"name" : "Guest Refunds"        },
        'Other'                : {"name" : "Other"                },
    };

    const getBookingActivities = async(bookingId) => {
        const bookingActivities = await activityService.get(bookingId);
            const activitiesByName = utils.groupBy(bookingActivities, (activity) => {
            return `${utils.to_YYMMdd(activity.startingAt)} ${activity.displayName}`
        });
        setActivities(activitiesByName);
    };

    const getBookings = async() => {
        const filter = {"after": utils.today(-30), "before" : utils.today(10)};
        const bookings = await bookingService.get(filter, onError);
        const bookingsByName = utils.groupBy(bookings, (booking) => {
            const house = booking.house === "harmony hill" ? "HH" : "JN";
            return `${utils.to_YYMMdd(booking.checkInAt)} ${house} ${booking.name}`
        });
        setBookings(bookingsByName);
    };

    // Initial validation
    useEffect(() => {
        validateFormData(emptyForm);
    }, []);

    useEffect(() => {
        const getUserPermissions = async() => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);
        } 

        getUserPermissions();
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

    
    const needsGuestInfo = (formDataCategory) => {
        const category = formDataCategory.category.trim().toLowerCase();
        return category === "guest expenses" || category === "guest refunds";
    }
    const needsActivityInfo = (formDataCategory) => {
        const category = formDataCategory.category.trim().toLowerCase();
        return category === "guest expenses" || category === "guest refunds";
    }

    // Fetch booking data only if needed and if it's not already fetched
    useEffect(() => {
        const guestInfoNeeded = needsGuestInfo(formData.category);
        const activityInfoNeeded = needsActivityInfo(formData.category);

        if(guestInfoNeeded && utils.isEmpty(bookings)) {
            getBookings();
        }
        if(activityInfoNeeded && utils.isEmpty(activities) && !utils.isEmpty(formData.bookingId)) {
            getBookingActivities(formData.bookingId);
        }

        if(!guestInfoNeeded) {
            handleChange("_batch", {
                "bookingId"  : null,
                "activityId" : null
            });
        }
    }, [formData]);

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        
        // Description auto generated sometimes, by category & purchases
        handleChange("_batch", {
            "description" : "",
            "purchasedBy" : name,
        });
    }

    const onCategorySelect = (category) => {
        const name = category ? category.name : '';

        const change = {
            "category"    : name,
            // Description auto generated sometimes, by category & purchases
            "description" : "",
        }

        const guestInfoNeeded = needsGuestInfo(category);

        if(!guestInfoNeeded) {
            change["bookingId"] = null;
            change["activityId"] = null;
        }

        handleChange("_batch", change);
    }

    const onPaymentMethodSelect = (paymentMethod) => {
        const name = paymentMethod ? paymentMethod.name : '';
        handleChange("paymentMethod", name);
    }

    const onBookingSelect = async (booking) => {
        const id = booking ? booking[0].id : '';
        handleChange("_batch", {
            "bookingId"  : id,
            "activityId" : null
        });
        
        if(needsActivityInfo(formData.category)) {
            getBookingActivities(id);
        }
    }

    const onActivitySelect = (activity) => {
        const id = activity ? activity[0].id : '';
        handleChange("activityId", id);
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

        // Auto fill description in some cases
        const category = nextFormData.category.trim().toLowerCase();
        if(utils.isEmpty(nextFormData.description) && !utils.isEmpty(category) && !utils.isEmpty(formData.purchasedBy)) {
            if(category === "food - daily market") {
                nextFormData.description = `Market Food, by ${formData.purchasedBy}`;
            }   
            if(category === "laundry") {
                nextFormData.description = `Laundry`;
            }
        }

        validateFormData(nextFormData);
    };

    const handleSubmit = async () => {
        try {
            if(!readyToSubmit) {
                onError(`Not yet ready to submit. Missing obligatory data`);
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
                setShowSuccess(true);
            } else {
                throw new Error("Receipt form data upload error");
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    // todo: put in database
    const paymentMethods = {
        'Cash' : {"name" : "Cash" },
    };

    if(isAdmin) {
        paymentMethods['Transfer'] = {"name" : "Transfer"};
    }

    let currentPaymentMethod = formData.paymentMethod;
    const paymentMethodNames = Object.keys(paymentMethods);
    if(paymentMethodNames.length === 1 && !currentPaymentMethod) {
        currentPaymentMethod = paymentMethodNames[0];
    }

    if(showList) {
        return (<ExpensesScreen onClose={() => setShowList(false)}/>);
    }

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Record New Expense</h2>
                </div>
            
                <div>
                    {!expenseToEdit && (
                        <button className="add-button" onClick={() => setShowList(true)}>
                            ☰
                        </button>
                    )}
                </div>
            </div>
            <div className="card-content">
                <UploadReceiptScreen 
                    current={formData.photoUrl} 
                    onUploadSuccess={(photo) => handleChange("photo", photo)}
                    resetTrigger={imageResetTrigger}
                />

                {(formData.photoUrl || formData.photo) && (<>
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
                            current={currentPaymentMethod}
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

                    {needsGuestInfo(formData.category) && (
                        <div className="purchase-form-group">
                            <Dropdown 
                                label={"Booking"} 
                                options={bookings}
                                current={formData.bookingId}
                                onSelect={onBookingSelect}
                            />
                        </div>
                    )}

                    {needsActivityInfo(formData.category) && !utils.isEmpty(formData.bookingId) && (
                        <div className="purchase-form-group">
                            <Dropdown 
                                label={"Activity"} 
                                options={activities}
                                current={formData.activityId}
                                onSelect={onActivitySelect}
                            />
                        </div>
                    )}

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

                    {/* Comments Field */}
                    <div className="form-group">
                        <label htmlFor="comments">Comments:</label>
                        <textarea
                            id="comments"
                            name="comments"
                            value={formData.comments}
                            onChange={(e) => handleChange(e.target.name, e.target.value)}
                            rows="4"
                            className="input"
                        ></textarea>
                    </div>
                </>)}

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
};
