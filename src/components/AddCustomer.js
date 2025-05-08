import React, { useState } from 'react';

function AddCustomer({ onCustomerAdded }) {
    const [name, setName] = useState('');
    const [guests, setGuests] = useState('');
    const [villa, setVilla] = useState('Jungle Nook'); // Default value
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [promotions, setPromotions] = useState('');
    const [source, setSource] = useState('');
    const [allergies, setAllergies] = useState('');
    const [country, setCountry] = useState('');
    const [otherDetails, setOtherDetails] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();

        const newCustomer = {
            id: Date.now().toString(), // Simple way to generate a unique ID
            name: name,
            guests: parseInt(guests) || 0, // Ensure it's a number
            villa: villa,
            stayDates: { start: startDate, end: endDate },
            purchases: [],
            promotions: promotions,
            source: source,
            allergies: allergies,
            country: country,
            otherDetails: otherDetails,
        };

        // Call the function passed from the parent to add the new customer
        onCustomerAdded(newCustomer);

        // Reset the form fields
        setName('');
        setGuests('');
        setVilla('Jungle Nook');
        setStartDate('');
        setEndDate('');
        setPromotions('');
        setSource('');
        setAllergies('');
        setCountry('');
        setOtherDetails('');
    };

    return (
        <div>
            <h2>Add New Customer</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="guests">Number of Guests:</label>
                    <input type="number" id="guests" value={guests} onChange={(e) => setGuests(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="villa">Villa:</label>
                    <select id="villa" value={villa} onChange={(e) => setVilla(e.target.value)}>
                        <option value="Jungle Nook">Jungle Nook</option>
                        <option value="Harmony Hill">Harmony Hill</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="startDate">Start Date:</label>
                    <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="endDate">End Date:</label>
                    <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="promotions">Promotions:</label>
                    <input type="text" id="promotions" value={promotions} onChange={(e) => setPromotions(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="source">Source:</label>
                    <input type="text" id="source" value={source} onChange={(e) => setSource(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="allergies">Allergies:</label>
                    <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="country">Country:</label>
                    <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="otherDetails">Other Details:</label>
                    <textarea id="otherDetails" value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} />
                </div>
                <button type="submit">Add Customer</button>
            </form>
        </div>
    );
}

export default AddCustomer;