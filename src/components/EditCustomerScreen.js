import React, { useState, useEffect } from 'react';
import BookingForm from './BookingForm.js';

export default function EditCustomerScreen({ onNavigate, onClose, customer}) {
    return (
        <div className="fullscreen">
            <div className="card-header">
                <h2 className="card-title">Edit Customer</h2>
            </div>
            <div className="card-content space-y-6">
                <BookingForm booking={customer} onNavigate={onNavigate} onClose={onClose} />
            </div>
        </div>
    );
};
