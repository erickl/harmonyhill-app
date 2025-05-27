import React, { useState, useEffect } from 'react';
// import { Pencil } from 'lucide-react';
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import * as utils from '../utils.js';

const EditCustomerScreen = ({ customer, onClose, onNavigate }) => {
    const [formData, setFormData] = useState({
        name: customer.name,
        house: customer.house,
        // checkInDate: customer.checkInDate ? customer.checkInDate.toISOString().split('T')[0] : '',
        checkInDate: customer.checkInDate ? new Date(customer.checkInDate) : '',
        checkOutDate: customer.checkOutDate ? customer.checkOutDate.toISOString().split('T')[0] : '',
        allergies: customer.allergies,
        country: customer.country,
        guestCount: customer.guestCount,
        otherDetails: customer.otherDetails,
        promotions: customer.promotions,
        roomRate: customer.roomRate,
        source: customer.source,
        status: customer.status,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        // const newValue = name.includes('Date') ? value : value;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.house || !formData.checkInDate || !formData.checkOutDate) {
            alert('Please fill in all required fields.');
            return;
        }

        const updatedCustomerData = {
            ...formData,
            checkInDate: new Date(formData.checkInDate),
            checkOutDate: new Date(formData.checkOutDate)
        };

        try {
            //  API call to update the customer
            await bookingService.update(customer.id, updatedCustomerData);

            alert('Customer updated successfully!');
            onNavigate('customers');
            onClose();
        } catch (err) {
            console.error('Error updating customer:', err);
            alert('Error updating customer. Please check the console for details.');
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
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="house">Villa:</label>
                        <input type="text" id="house" name="house" value={formData.house} onChange={handleChange} required className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="checkInDate">Check-in:</label>
                        <input type="date" id="checkInDate" name="checkInDate" value={formData.checkInDate} onChange={handleChange} required className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="checkOutDate">Check-out:</label>
                        <input type="date" id="checkOutDate" name="checkOutDate" value={formData.checkOutDate} onChange={handleChange} required className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="allergies">Allergies:</label>
                        <input type="text" id="allergies" name="allergies" value={formData.allergies} onChange={handleChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="country">Country:</label>
                        <input type="text" id="country" name="country" value={formData.country} onChange={handleChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="guestCount">Guest Count:</label>
                        <input type="number" id="guestCount" name="guestCount" value={formData.guestCount} onChange={handleChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="otherDetails">Other Details:</label>
                        <textarea
                            id="otherDetails"
                            name="otherDetails"
                            value={formData.otherDetails}
                            onChange={handleChange}
                            className="input"
                            rows="4" // Specifies the visible number of lines
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="promotions">Promotions:</label>
                        <textarea
                            id="otherDetails"
                            name="otherDetails"
                            value={formData.otherDetails}
                            onChange={handleChange}
                            className="input"
                            rows="4" // Specifies the visible number of lines
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="roomRate">Room Rate:</label>
                        <input type="number" id="roomRate" name="roomRate" value={formData.roomRate} onChange={handleChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="source">Source:</label>
                        <input type="text" id="source" name="source" value={formData.source} onChange={handleChange} className="input" />
                    </div>
                    {/* <div className="form-group">
                        <label htmlFor="status">Status:</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className="input">
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
