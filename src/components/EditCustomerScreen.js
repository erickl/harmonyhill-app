import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import MyDatePicker from "./MyDatePicker.js";
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import * as utils from '../utils.js';

const EditCustomerScreen = ({ customer, onClose, onNavigate }) => {

    const [formData, setFormData] = useState({
        name:         customer.name,
        house:        customer.house,
        checkInAt:    customer.checkInAt,
        checkOutAt:   customer.checkOutAt,
        allergies:    customer.allergies,
        country:      customer.country,
        guestCount:   customer.guestCount,
        otherDetails: customer.otherDetails,
        promotions:   customer.promotions,
        roomRate:     customer.roomRate,
        source:       customer.source,
        status:       customer.status,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleOtherInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value }); 
    };

    const onError = (message) => {
        console.log(message);
        alert(message);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.house || !formData.checkInAt || !formData.checkOutAt) {
            alert('Please fill in all required fields.');
            return;
        }

        const updatedCustomerData = {
            ...formData,
        };

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
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="house">Villa:</label>
                        <input type="text" id="house" name="house" value={formData.house} onChange={handleInputChange} required className="input" />
                    </div>                  
                    <div className="form-group">
                        <label htmlFor="checkInAt">Check In Date</label>
                        <MyDatePicker name={"checkInAt"} value={formData.checkInAt} onChange={handleOtherInputChange}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="checkOutAt">Check Out Date</label>
                        <MyDatePicker name={"checkOutAt"} value={formData.checkOutAt} onChange={handleOtherInputChange}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="allergies">Allergies:</label>
                        <input type="text" id="allergies" name="allergies" value={formData.allergies} onChange={handleInputChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="country">Country:</label>
                        <input type="text" id="country" name="country" value={formData.country} onChange={handleInputChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="guestCount">Guest Count:</label>
                        <input type="number" id="guestCount" name="guestCount" value={formData.guestCount} onChange={handleInputChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="otherDetails">Other Details:</label>
                        <textarea
                            id="otherDetails"
                            name="otherDetails"
                            value={formData.otherDetails}
                            onChange={handleInputChange}
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
                            onChange={handleInputChange}
                            className="input"
                            rows="4" // visible lines count
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="roomRate">Room Rate:</label>
                        <input type="number" id="roomRate" name="roomRate" value={formData.roomRate} onChange={handleInputChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="source">Source:</label>
                        <input type="text" id="source" name="source" value={formData.source} onChange={handleInputChange} className="input" />
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
        </div>
    );
};
export default EditCustomerScreen;
