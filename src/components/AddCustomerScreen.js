import React, { useState, useEffect } from 'react';
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import './AddCustomerScreen.css';


const AddCustomerScreen = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        house: '',
        checkInAt: '',
        checkOutAt: '',
        guestCount: 1,
        allergies: '',
        otherDetails: '',
        promotions: '',
        country: '',
        source: '',
    });

    // for calculating the length of stay based on checkin and checkout date 
    const [stayDuration, setStayDuration] = useState('');

    useEffect(() => {
        if (formData.checkInAt && formData.checkOutAt) {
            const checkIn = new Date(formData.checkInAt);
            const checkOut = new Date(formData.checkOutAt);
            const timeDiff = checkOut - checkIn;
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            setStayDuration(`${diffDays} days`);
        } else {
            setStayDuration('');
        }
    }, [formData.checkInAt, formData.checkOutAt]);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = async () => { // for submitting to the database
        // Basic validation
        if (!formData.house || !formData.checkInAt || !formData.checkOutAt || !formData.name) {
            alert('Please fill in all required fields.'); // Use a better UI alert
            return;
        }

        // Prepare the data for submission.  Convert dates if they are strings
        const bookingData = {
            ...formData
            // checkInDate: typeof formData.checkInDate === 'string' ? new Date(formData.checkInDate) : formData.checkInDate,
            // checkOutDate: typeof formData.checkOutDate === 'string' ? new Date(formData.checkOutDate) : formData.checkOutDate,
        };

        // Call the onAddCustomer function (passed from App.js)
        try {
            await bookingService.add(bookingData);
            // Optionally, reset the form or show a success message
            setFormData({  //reset form
                house: '',
                name: '',
                checkInAt: '',
                checkOutAt: '',
                guestCount: 1,
                allergies: '',
                otherDetails: '',
                promotions: '',
                country: '',
                source: '',
            });
            setStayDuration(''); // Clear stay duration
            alert('Customer added successfully!'); //  provide user feedback
            onNavigate('customers'); // Go back to customers list
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
                                onChange={() => handleInputChange('house', 'Harmony Hill')}

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
                                onChange={() => handleInputChange('house', 'The Jungle Nook')}

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

                {/* Check-in Date */}
                <div>
                    <h3>Check-in Date</h3>
                    <input
                        type="date"
                        value={formData.checkInAt}
                        onChange={(e) => handleInputChange('checkInAt', e.target.value)}

                    />
                </div>

                {/* Check-out Date */}
                <div>
                    <h3>Check-out Date</h3>
                    <input
                        type="date"
                        value={formData.checkOutAt}
                        onChange={(e) => handleInputChange('checkOutAt', e.target.value)}

                    // min={formData.checkInDate}
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

