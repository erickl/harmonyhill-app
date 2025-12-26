import React, { useState, useEffect } from 'react';
import "./BookingForm.css";
import * as utils from "../utils.js";
import * as bookingService from "../services/bookingService.js";
import MyDatePicker from './MyDatePicker.js';
import ButtonsFooter from './ButtonsFooter.js';
import TextInput from './TextInput.js';
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";

export default function BookingForm({ booking, onClose }) {
    // for calculating the length of stay based on checkin and checkout date 
    const [nightsCount, setNightsCount] = useState('');
    const [readyToSubmit, setReadyToSubmit] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [validationWarning, setValidationWarning] = useState(null);

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
        guestPaid:           booking ? booking.guestPaid           : '',
        hostPayout:          booking ? booking.hostPayout          : '',
    };

    const [formData, setFormData] = useState(initialFormData);

    const validateFormData = (newFormData) => {
        const validationResult = bookingService.validate(newFormData, setValidationError, setValidationWarning);
        setReadyToSubmit(validationResult);
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

            <TextInput
                type="text"
                name="name"
                label={"Guest Name"}
                value={formData.name}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="text"
                name="phoneNumber"
                label={"Phone number"}
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="text"
                name="email"
                label={"Email"}
                value={formData.email}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />
           
            <MyDatePicker 
                name={"checkInAt"}
                label={"Checkin"}
                date={formData.checkInAt} 
                time={formData.checkInTime} 
                onChange={handleInputChange}
            />

            <MyDatePicker 
                name={"checkOutAt"} 
                label={"Checkout"} 
                date={formData.checkOutAt} 
                time={formData.checkOutTime} 
                onChange={handleInputChange}
            />

            <div>
                <h3>Length of Stay</h3>
                <p>{nightsCount}</p>
            </div>

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

            <TextInput
                type="text"
                name="dietaryRestrictions"
                label={"Dietary Restrictions"}
                value={formData.dietaryRestrictions}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="text"
                name="customerInfo"
                label={"Customer Info"}
                value={formData.customerInfo}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="text"
                name="arrivalInfo"
                label={"Arrival Info"}
                value={formData.arrivalInfo}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="text"
                name="specialRequests"
                label={"Special Requests"}
                value={formData.specialRequests}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="text"
                name="promotions"
                label={"Promotions"}
                value={formData.promotions}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="text"
                name="country"
                label={"Country"}
                value={formData.country}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="amount"
                name="guestPaid"
                label={"Guest Paid"}
                value={formData.guestPaid}
                onChange={(e) => handleInputChange(e.target.name, e.target.value, "amount")}
            />

            <TextInput
                type="amount"
                name="hostPayout"
                label={"Host Payout"}
                value={formData.hostPayout}
                onChange={(e) => handleInputChange(e.target.name, e.target.value, "amount")}
            />

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

            {(validationWarning && <p className="validation-warning">{`Warning: ${validationWarning}`}</p>)}
            {(validationError && <p className="validation-error">{`Error: ${validationError}`}</p>)}

            <ButtonsFooter 
                onCancel={onClose} 
                onSubmit={handleSubmit}
                submitEnabled={readyToSubmit}
            />
        </div>
    );
};
