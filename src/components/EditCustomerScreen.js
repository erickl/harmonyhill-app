import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import MyDatePicker from "./MyDatePicker.js";
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import * as utils from '../utils.js';
import ErrorNoticeModal from './ErrorNoticeModal.js';

const EditCustomerScreen = ({ customer, onClose, onNavigate }) => {

    const [formData, setFormData] = useState({
        name:                customer.name,
        phoneNumber:         customer.phoneNumber,
        email:               customer.email,
        house:               customer.house,
        checkInAt:           customer.checkInAt,
        checkInTime:         customer.checkInTime,
        checkOutAt:          customer.checkOutAt,
        checkOutTime:        customer.checkOutTime,
        dietaryRestrictions: customer.dietaryRestrictions,
        country:             customer.country,
        guestCount:          customer.guestCount,
        customerInfo:        customer.customerInfo,
        arrivalInfo:         customer.arrivalInfo,
        specialRequests:     customer.specialRequests,
        promotions:          customer.promotions,
        roomRate:            customer.roomRate,
        source:              customer.source,
        status:              customer.status,
    });

    const handleInputChange = (name, value) => {
        let nextFormData = {};
                
        if (name === "_batch" && typeof value === 'object' && value !== null) {
            nextFormData = ({ ...formData, ...value });
        } else {
            nextFormData = { ...formData, [name]: value };
        }
        
        if(!utils.isEmpty(nextFormData)) {
            setFormData(nextFormData);
        }
    };

    const [errorMessage, setErrorMessage] = useState(null);
        
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.house || !formData.checkInAt || !formData.checkOutAt) {
            onError('Please fill in all required fields.');
            return;
        }

        const updatedCustomerData = { ...formData };

        try {
            //  API call to update the customer
            const updateResult = await bookingService.update(customer.id, updatedCustomerData, onError);

            if(updateResult) {
                onNavigate('customers');
                onClose();
            }      
        } catch (e) {
            onError(`Error updating customer: ${e.message}`);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Edit Customer</h2>
            </div>
            <div className="card-content">
                <form onSubmit={handleSubmit} className="edit-customer-form">
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            required className="input" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone number:</label>
                        <input 
                            type="tel" 
                            id="phoneNumber" 
                            name="phoneNumber" 
                            value={formData.phoneNumber} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            className="input" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Phone number:</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            className="input" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="house">Villa:</label>
                        <input 
                            type="text" 
                            id="house" 
                            name="house" 
                            value={formData.house} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            required className="input" 
                        />
                    </div>                  
                    <div className="form-group">
                        <label htmlFor="checkInAt">Check In Date</label>
                        <MyDatePicker 
                            name={"checkInAt"} 
                            date={formData.checkInAt} 
                            time={formData.checkInTime} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="checkOutAt">Check Out Date</label>
                        <MyDatePicker 
                            name={"checkOutAt"} 
                            date={formData.checkOutAt} 
                            time={formData.checkOutTime}
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dietaryRestrictions">Dietary restrictions:</label>
                        <input 
                            type="text" 
                            id="dietaryRestrictions" 
                            name="dietaryRestrictions" 
                            value={formData.dietaryRestrictions} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            className="input" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="country">Country:</label>
                        <input 
                            type="text" 
                            id="country" 
                            name="country" 
                            value={formData.country} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            className="input" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="guestCount">Guest Count:</label>
                        <input 
                            type="number" 
                            id="guestCount" 
                            name="guestCount" v
                            alue={formData.guestCount} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            className="input" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="customerInfo">Other Customer Information:</label>
                        <textarea
                            id="customerInfo"
                            name="customerInfo"
                            value={formData.customerInfo}
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                            className="input"
                            rows="4" // visible lines count
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="arrivalInfo">Arrival Information:</label>
                        <textarea
                            id="arrivalInfo"
                            name="arrivalInfo"
                            value={formData.arrivalInfo}
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                            className="input"
                            rows="4" // visible lines count
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="specialRequests">Special Requests:</label>
                        <textarea
                            id="specialRequests"
                            name="specialRequests"
                            value={formData.specialRequests}
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                            className="input"
                            rows="4" // visible lines count
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="promotions">Promotions:</label>
                        <textarea
                            id="promotions"
                            name="promotions"
                            value={formData.promotions}
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                            className="input"
                            rows="4" // visible lines count
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="roomRate">Room Rate:</label>
                        <input 
                            type="number" 
                            id="roomRate" 
                            name="roomRate" 
                            value={formData.roomRate} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            className="input" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="source">Source:</label>
                        <input 
                            type="text" 
                            id="source" 
                            name="source" 
                            value={formData.source} 
                            onChange={(e) => handleInputChange(e.target.name, e.target.value)} 
                            className="input" 
                        />
                    </div>
                    {/* <div className="form-group">
                        <label htmlFor="status">Status:</label>
                        <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="input">
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checkedin">Checked In</option>
                            <option value="checkedout">Checked Out</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div> */}
                    <br></br>

                    <button type="submit">Update Customer</button><br></br>
                    <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
                </form>
            </div>

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
};

export default EditCustomerScreen;
