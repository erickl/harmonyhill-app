import React, { useState, useEffect } from 'react';
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import './AddCustomerScreen.css';
import MyDatePicker from "./MyDatePicker.js";
import * as utils from '../utils.js';


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
    };

    const [formData, setFormData] = useState(initialFormData);

    // for calculating the length of stay based on checkin and checkout date 
    const [stayDuration, setStayDuration] = useState('');

    useEffect(() => {
        if (formData.checkInAt && formData.checkOutAt) {
            const diffDays = bookingService.calculateNightsStayed(formData.checkOutAt, formData.checkInAt);
            setStayDuration(`${diffDays} night${diffDays == 1 ? "" : "s"}`);
        } else {
            setStayDuration('');
        }
    }, [formData.checkInAt, formData.checkOutAt]);

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

    const handleSubmit = async () => { 
        // Basic validation
        if (!formData.house || !formData.checkInAt || !formData.checkOutAt || !formData.name) {
            alert('Please fill in all required fields.'); // todo: Use a better UI alert
            return;
        }

        // Prepare the data for submission.  Convert data if needed
        const bookingData = {
            ...formData
        };

        // Call the onAddCustomer function (passed from App.js)
        try {
            const createResult = await bookingService.add(bookingData);
            if(createResult !== false) {
                // Optionally, reset the form or show a success message
                setFormData(initialFormData);
                setStayDuration(''); // Clear stay duration
                alert('Customer added successfully!'); //  provide user feedback
                onNavigate('customers'); // Go back to customers list
            } else {
                alert("Failed to add customer.");
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer. Please check the console for details.'); // Inform the user
        }
    };

    const guestCountOptions = Array.from({ length: 6 }, (_, i) => i + 1);

    return (
        <div className="card">
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
                    <label htmlFor="checkInAt">Check In Date</label>
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
                    <p>{stayDuration}</p>

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
                    <h3>Other Details</h3>
                    <textarea
                        placeholder="Enter other details"
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
                                checked={formData.source === 'AirBnB'}
                                onChange={() => handleInputChange('source', 'AirBnB')}

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
                                checked={formData.source === 'Direct'}
                                onChange={() => handleInputChange('source', 'Direct')}

                            />
                            <label htmlFor="direct">
                                Direct
                            </label>
                        </div>
                    </div>
                </div>

                <div className="add-customer-buttons">

                    <button
                        onClick={() => onNavigate('customers')} className="cancel-button"
                    >
                        Back to Customers
                    </button>
                    <button onClick={handleSubmit}> {/*Submit button */}
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCustomerScreen;

