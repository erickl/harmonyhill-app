import React, { useState, useEffect } from 'react';
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import './AddCustomerScreen.css';
import MyDatePicker from "./MyDatePicker.js";
import * as utils from '../utils.js';


const AddCustomerScreen = ({ onNavigate }) => {
    const initialFormData = {
        house:        '',
        // MyDatePicker requires initial value to be null because of AdapterLuxon
        checkInAt:    null, 
        checkOutAt:   null,
        guestCount:   1,
        allergies:    '',
        otherDetails: '',
        promotions:   '',
        country:      '',
        source:       '',
    };

    const [formData, setFormData] = useState(initialFormData);

    // for calculating the length of stay based on checkin and checkout date 
    const [stayDuration, setStayDuration] = useState('');

    useEffect(() => {
        if (formData.checkInAt && formData.checkOutAt) {
            const timeDiff = formData.checkOutAt - formData.checkInAt;
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            setStayDuration(`${diffDays} night${diffDays == 1 ? "" : "s"}`);
        } else {
            setStayDuration('');
        }
    }, [formData.checkInAt, formData.checkOutAt]);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleOtherInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value }); 
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
                                value="Harmony Hill"
                                checked={formData.house === 'Harmony Hill'}
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
                                value="The Jungle Nook"
                                checked={formData.house === 'The Jungle Nook'}
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

                <div className="form-group">
                    <label htmlFor="checkInAt">Check In Date</label>
                    <MyDatePicker name={"checkInAt"} value={formData.checkInAt} onChange={handleOtherInputChange}/>
                </div>

                <div>
                    <h3>Check-out Date</h3>
                    <MyDatePicker name={"checkOutAt"} value={formData.checkOutAt} onChange={handleOtherInputChange}/>
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

                {/* Allergies */}
                <div>
                    <h3>Allergies</h3>
                    <textarea
                        placeholder="Enter allergies"
                        value={formData.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}

                    />
                </div>

                {/* Other Details */}
                <div>
                    <h3>Other Details</h3>
                    <textarea
                        placeholder="Enter other details"
                        value={formData.otherDetails}
                        onChange={(e) => handleInputChange('otherDetails', e.target.value)}

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

