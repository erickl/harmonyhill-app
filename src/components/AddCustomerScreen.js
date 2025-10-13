import React, { useState, useEffect } from 'react';
import './AddCustomerScreen.css';
import BookingForm from './BookingForm.js';

export default function AddCustomerScreen({ customer, onNavigate }) {
    return (
        <div className="fullscreen">
            <div className="card-header">
                <h2 className="card-title">Add New Customer</h2>
            </div>
            <div className="card-content space-y-6">      
                <BookingForm booking={customer} onClose={() => onNavigate('customers')} />
            </div>
        </div>
    );
};
