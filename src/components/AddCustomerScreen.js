import React, { useState, useEffect } from 'react';
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import './AddCustomerScreen.css';
import MyDatePicker from "./MyDatePicker.js";
import * as utils from '../utils.js';
import { useNotification } from "../context/NotificationContext.js";
import ButtonsFooter from './ButtonsFooter.js';
import BookingForm from './BookingForm.js';
import { useSuccessNotification } from "../context/SuccessContext.js";

const AddCustomerScreen = ({ onNavigate }) => {
    const initialFormData = {
        house:               '',
        phoneNumber:         '',
        email:               '',
        // MyDatePicker requires initial value to be null because of AdapterLuxon
        checkInAt:           null, 
        checkInTime:         null, 
        checkOutAt:          null,
        checkOutTime:        null,
        guestCount:          1,
        dietaryRestrictions: '',
        customerInfo:        '',
        arrivalInfo:         '',
        specialRequests:     '',
        promotions:          '',
        country:             '',
        source:              '',
        roomRate:            '',
        guestPaid:           '',
        hostPayout:          '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [readyToSubmit, setReadyToSubmit] = useState(false);

    const [validationError, setValidationError] = useState(null);

    const onValidationError = (error) => {
        setValidationError(error);
    }

    const { onError } = useNotification();
    const {onSuccess} = useSuccessNotification();

    const validateFormData = (newFormData) => {
        const validationResult = bookingService.validate(newFormData, onValidationError);

        setReadyToSubmit(validationResult);

        if(validationResult === true) {
            setValidationError(null);
        }
    }

    // for calculating the length of stay based on checkin and checkout date 
    const [nightsCount, setNightsCount] = useState('');

    // Initial validation
    useEffect(() => {
        validateFormData(initialFormData);
    }, []);

    useEffect(() => {
        if (formData.checkInAt && formData.checkOutAt) {
            const diffDays = bookingService.calculateNightsStayed(formData.checkInAt, formData.checkOutAt);
            setNightsCount(`${diffDays} night${diffDays == 1 ? "" : "s"}`);
            handleInputChange("nightsCount", diffDays);
        } else {
            setNightsCount('');
        }
    }, [formData.checkInAt, formData.checkOutAt]);

    const handleInputChange = (name, value, type) => {
        let nextFormData = {};
        
        if (name === "_batch" && typeof value === 'object' && value !== null) {
            nextFormData = ({ ...formData, ...value });
        } else if(type === "amount") {
            nextFormData = { ...formData, [name]: utils.cleanNumeric(value)};
        } else {
            nextFormData = { ...formData, [name]: value };
        }
        
        if(!utils.isEmpty(nextFormData)) {
            setFormData(nextFormData);
        }

        validateFormData(nextFormData);
    };

    const handleSubmit = async () => { 
        // Prepare the data for submission.  Convert data if needed
        const bookingData = {
            ...formData
        };

        // Call the onAddCustomer function (passed from App.js)
        try {
            const createResult = await bookingService.add(bookingData, onError);
            if(createResult !== false) {
                onSuccess();

                // Optionally, reset the form or show a success message
                setFormData(initialFormData);
                setNightsCount(''); // Clear stay duration

                onNavigate('customers'); // Go back to customers list
            } else {
                onError("Failed to add customer.");
            }
        } catch (error) {
            onError('Error adding customer:', error);
        }
    };

    const guestCountOptions = Array.from({ length: 6 }, (_, i) => i + 1);

    return (
        <div className="fullscreen">
            <div className="card-header">
                <h2 className="card-title">Add New Customer</h2>
            </div>
            <div className="card-content space-y-6">
                {/* House */}
                <div>
                    <h3>House</h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="harmonyHill"
                                name="house"
                                value="harmony hill"
                                checked={formData.house === 'harmony hill'}
                                onChange={() => handleInputChange('house', 'harmony hill')}

                            />
                            <label htmlFor="harmonyHill">
                                Harmony Hill
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="jungleNook"
                                name="house"
                                value="the jungle nook"
                                checked={formData.house === 'the jungle nook'}
                                onChange={() => handleInputChange('house', 'the jungle nook')}

                            />
                            <label htmlFor="jungleNook">
                                The Jungle Nook
                            </label>
                        </div>
                    </div>
                </div>

                {/* Name */}
                <div>
                    <h3>
                        Guest Name
                    </h3>
                    <textarea
                        placeholder="Enter guest name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}

                    />
                </div>

                {/* Phone number */}
                <div>
                    <h3>Phone number</h3>
                    <input
                        placeholder="Enter phone number"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}

                    />
                </div>

                {/* Email */}
                <div>
                    <h3>Email</h3>
                    <input
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}

                    />
                </div>

                <div className="form-group">
                    <h3>Check-In Date</h3>
                    <MyDatePicker 
                        name={"checkInAt"} 
                        date={formData.checkInAt} 
                        time={formData.checkInTime} 
                        onChange={handleInputChange}
                    />
                </div>

                <div>
                    <h3>Check-out Date</h3>
                    <MyDatePicker 
                        name={"checkOutAt"} 
                        date={formData.checkOutAt} 
                        time={formData.checkOutTime} 
                        onChange={handleInputChange}
                    />
                </div>

                {/* Length of Stay */}
                <div>
                    <h3>Length of Stay</h3>
                    <p>{nightsCount}</p>
                </div>

                {/* Guest Count */}
                <div>
                    <h3>Guest Count</h3>
                    <select
                        value={formData.guestCount}
                        onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value, 10))}

                    >
                        {guestCountOptions.map((count) => (
                            <option key={count} value={count}>
                                {count}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Dietary Restrictions */}
                <div>
                    <h3>Dietary Restrictions</h3>
                    <textarea
                        placeholder="Enter dietary restrictions"
                        value={formData.dietaryRestrictions}
                        onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}

                    />
                </div>

                {/* Other Details */}
                <div>
                    <h3>Other Details</h3>
                    <textarea
                        placeholder="Enter other details"
                        value={formData.customerInfo}
                        onChange={(e) => handleInputChange('customerInfo', e.target.value)}
                    />
                </div>

                {/* Arrival Information */}
                <div>
                    <h3>Arrival Information</h3>
                    <textarea
                        placeholder="Enter other details"
                        value={formData.arrivalInfo}
                        onChange={(e) => handleInputChange('arrivalInfo', e.target.value)}
                    />
                </div>

                {/* Special Requests */}
                <div>
                    <h3>Special Requests</h3>
                    <textarea
                        placeholder="Enter special requests"
                        value={formData.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}

                    />
                </div>

                {/* Promotions */}
                <div>
                    <h3>Promotions</h3>
                    <input
                        placeholder="Enter promotions"
                        value={formData.promotions}
                        onChange={(e) => handleInputChange('promotions', e.target.value)}

                    />
                </div>

                {/* Country */}
                <div>
                    <h3>Country</h3>
                    <input
                        placeholder="Enter country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}

                    />
                </div>

                <div className="purchase-form-group">
                    <h3>Room Rate</h3>
                    <span className="currency-prefix">{utils.getCurrency()}</span>
                    <input
                        type="text" // Changed from "number" to "text"
                        id="roomRate"
                        name="roomRate"
                        // Apply formatting here for display inside the input
                        value={utils.formatDisplayPrice(formData.roomRate)}
                        onChange={(e) => handleInputChange(e.target.name, e.target.value, "amount")}
                        className="input"
                    />
                </div>

                <div className="purchase-form-group">
                    <h3>Guest Paid</h3>
                    <span className="currency-prefix">{utils.getCurrency()}</span>
                    <input
                        type="text" // Changed from "number" to "text"
                        id="guestPaid"
                        name="guestPaid"
                        // Apply formatting here for display inside the input
                        value={utils.formatDisplayPrice(formData.guestPaid)}
                        onChange={(e) => handleInputChange(e.target.name, e.target.value, "amount")}
                        className="input"
                    />
                </div>

                <div className="purchase-form-group">
                    <h3>Host Payout</h3>
                    <span className="currency-prefix">{utils.getCurrency()}</span>
                    <input
                        type="text" // Changed from "number" to "text"
                        id="hostPayout"
                        name="hostPayout"
                        // Apply formatting here for display inside the input
                        value={utils.formatDisplayPrice(formData.hostPayout)}
                        onChange={(e) => handleInputChange(e.target.name, e.target.value, "amount")}
                        className="input"
                    />
                </div>

                {/* Source */}
                <div>
                    <h3>Source</h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="airBnb"
                                name="source"
                                value="AirBnB"
                                checked={formData.source === 'airbnb'}
                                onChange={() => handleInputChange('source', 'airbnb')}

                            />
                            <label htmlFor="airBnb">
                                AirBnB
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="direct"
                                name="source"
                                value="Direct"
                                checked={formData.source === 'direct'}
                                onChange={() => handleInputChange('source', 'direct')}

                            />
                            <label htmlFor="direct">
                                Direct
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* <BookingForm
                formData={formData}
            /> */}

            {(validationError && <p className="validation-error">{validationError}</p>)}

            <ButtonsFooter 
                onCancel={() => onNavigate('customers')} 
                onSubmit={handleSubmit}
                submitEnabled={readyToSubmit}
            />
        </div>
    );
};

export default AddCustomerScreen;
