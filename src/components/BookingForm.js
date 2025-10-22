import React, { useState, useEffect } from 'react';
import "./BookingForm.css";
import * as utils from "../utils.js";
import * as bookingService from "../services/bookingService.js";
import MyDatePicker from './MyDatePicker.js';
import ButtonsFooter from './ButtonsFooter.js';
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";

export default function BookingForm({ booking, onClose }) {
    // for calculating the length of stay based on checkin and checkout date 
    const [nightsCount, setNightsCount] = useState('');
    const [readyToSubmit, setReadyToSubmit] = useState(false);
    const [validationError, setValidationError] = useState(null);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();

    const initialFormData = {
        name:                booking ? booking.name                : '', 
        house:               booking ? booking.house               : '',
        phoneNumber:         booking ? booking.phoneNumber         : '',
        email:               booking ? booking.email               : '',
        checkInAt:           booking ? booking.checkInAt           : null, 
        checkInTime:         booking ? booking.checkInTime         : null, 
        checkOutAt:          booking ? booking.checkOutAt          : null,
        checkOutTime:        booking ? booking.checkOutTime        : null,
        guestCount:          booking ? booking.guestCount          : 1,
        dietaryRestrictions: booking ? booking.dietaryRestrictions : '',
        customerInfo:        booking ? booking.customerInfo        : '',
        arrivalInfo:         booking ? booking.arrivalInfo         : '',
        specialRequests:     booking ? booking.specialRequests     : '',
        promotions:          booking ? booking.promotions          : '',
        country:             booking ? booking.country             : '',
        source:              booking ? booking.source              : '',
        roomRate:            booking ? booking.roomRate            : '',
        guestPaid:           booking ? booking.guestPaid           : '',
        hostPayout:          booking ? booking.hostPayout          : '',
    };

    const [formData, setFormData] = useState(initialFormData);

    const validateFormData = (newFormData) => {
        const validationResult = bookingService.validate(newFormData, onValidationError);

        setReadyToSubmit(validationResult);

        if(validationResult === true) {
            setValidationError(null);
        }
    }

    const handleSubmit = async () => { 
        const bookingData = {
            ...formData
        };

        try {
            let result = false;
            if(booking) {
                result = await bookingService.update(booking.id, bookingData, onError);
            } else {
                 result = await bookingService.add(bookingData, onError);
            }
           
            if(result !== false) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            onError(`Error ${booking ? "editing" : "adding"} booking: ${error.message}`);
        }
    };

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

    const onValidationError = (error) => {
        setValidationError(error);
    }

    // Initial validation
    useEffect(() => {
        validateFormData(formData);
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

    const guestCountOptions = Array.from({ length: 6 }, (_, i) => i + 1);

    return (
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
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="booking.com"
                            name="source"
                            value="Booking.com"
                            checked={formData.source === 'booking.com'}
                            onChange={() => handleInputChange('source', 'booking.com')}

                        />
                        <label htmlFor="booking.com">
                            Booking.com
                        </label>
                    </div>
                </div>
            </div>

            {(validationError && <p className="validation-error">{validationError}</p>)}

            <ButtonsFooter 
                onCancel={onClose} 
                onSubmit={handleSubmit}
                submitEnabled={readyToSubmit}
            />
        </div>
    );
};
