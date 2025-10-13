import React, { useState, useEffect } from 'react';
import BookingForm from './BookingForm.js';

export default function EditCustomerScreen({ customer, onClose, onNavigate }) {
    return (
        <div className="fullscreen">
            <div className="card-header">
                <h2 className="card-title">Edit Customer</h2>
            </div>
            <div className="card-content space-y-6">
                <BookingForm booking={customer} onClose={onClose} />
            </div>
        </div>
    );
};
