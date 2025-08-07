import React, { useState, useEffect } from 'react';
import UploadReceiptScreen from './UploadReceiptScreen';
import * as utils from "../utils";

export default function ExpensesScreen({ onNavigate }) {

    // Helper function to get today's date in YYYY-MM-DD format for input type="date"
    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // State to manage form data
    const [formData, setFormData] = useState({
        photo: null, // To hold photo data if a scanner were integrated
        amount: '',
        category: '',
        date: getTodayDateString(), // Pre-fill with today's date
        description: '',
        comments: '',
    });

    // Sample categories for the dropdown
    const categories = [
        'Food - Daily market',
        'Food - Non-market',
        'Laundry',
        'Pool',
        'Other villa supplies',
        'Guest expenses',
        'Utilities',
        'Maintenance',
        'Donations',
        'Assets',
        'Tax & accounting',
        'Guest refunds',
        'Other'
    ];

    // Function to reset the form to its initial state
    const resetForm = () => {
        setFormData({
            photo: null,
            amount: '',
            category: '',
            date: getTodayDateString(), // Reset to today's date
            description: '',
            comments: '',
        });
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] }); // For photo input
        } else if (name === 'amount') {
            // Remove non-digit characters for amount, then parse
            const cleanValue = value.replace(/[^0-9]/g, '');
            const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.amount || !formData.category || !formData.date || !formData.description) {
            alert('Please fill in all required fields (Amount, Category, Date, Description).');
            return;
        }

        // You might add more specific validation here, e.g., for amount > 0, valid date, etc.
        if (typeof formData.amount !== 'number' || isNaN(formData.amount) || formData.amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        console.log('Expense Submitted:', formData);
        alert('Expense recorded successfully!');

        // Reset form to initial state but DO NOT close the screen
        resetForm(); // Call the reset function
        // onNavigate('expenses-list'); // If later we want to go to a list of expenses
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Record New Expense</h2>
            </div>
            <div className="card-content">
                <p>To be released soon....</p>
                {/* <UploadReceiptScreen /> 
                    <form>
                    <div className="purchase-form-group">
                        <label htmlFor="purchasePrice">Price:</label>
                        <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                {/* <span className="currency-prefix">{utils.getCurrency()}</span>
                            <input
                                type="text" // Changed from "number" to "text"
                                id="amount"
                                name="amount"
                                // Apply formatting here for display inside the input
                                value={utils.formatDisplayPrice(0)}
                                onChange={(e) => {}}//handleFormDataChange(e.target.name, e.target.value, "amount")}
                                className="input"
                            />
                        </div>
                    </div>
                </form> */}

                <form onSubmit={handleSubmit} className="form-container">
                    {/* Photo Scanner Placeholder */}
                    <div className="form-group">
                        <label htmlFor="photoScanner">Photo Scanner:</label>
                        <div id="photoScanner" className="photo-scanner-placeholder">
                            {/* This div represents where a scanner or file input UI would go */}
                            <p>📸 Scanner placeholder (future integration)</p>
                            {/* Example: <input type="file" accept="image/*" capture="camera" onChange={handleChange} name="photo" /> */}
                        </div>
                    </div>

                    {/* Amount in IDR */}
                    <div className="form-group">
                        <label htmlFor="amount">Amount (IDR):</label>
                        <div className="currency-input-wrapper">
                            <span className="currency-prefix">Rp</span>
                            <input
                                type="text" // Use text to allow manual formatting display, number for numeric input
                                id="amount"
                                name="amount"
                                value={
                                    typeof formData.amount === 'number' && !isNaN(formData.amount)
                                        ? formData.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                        : ''
                                }
                                onChange={handleChange}
                                required
                                className="input"
                                // pattern="[0-9]*" // Optional: for mobile keyboards
                                inputMode="numeric" // Optional: for mobile keyboards
                            />
                        </div>
                    </div>

                    {/* Category Dropdown */}
                    <div className="form-group">
                        <label htmlFor="category">Category:</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="input"
                        >
                            <option value="">-- Select a Category --</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Field */}
                    <div className="form-group">
                        <label htmlFor="date">Date:</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>

                    {/* Description Field */}
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>

                    {/* Comments Field (Optional) */}
                    <div className="form-group">
                        <label htmlFor="comments">Comments (Optional):</label>
                        <textarea
                            id="comments"
                            name="comments"
                            value={formData.comments}
                            onChange={handleChange}
                            rows="4"
                            className="input"
                        ></textarea>
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button type="button" onClick={resetForm} className="button cancel-button">Reset</button>

                        <button disabled={true} type="submit" className="button">Record Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
