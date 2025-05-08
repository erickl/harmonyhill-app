import React from 'react';
import './CustomerList.css';

function CustomerList({ customers, onCustomerClick }) {
    return (
        <div>
            <h2>Customer List</h2>
            <ul>
                {customers.map(customer => (
                    <li key={customer.id}>
                        <button className="customer-list-item" onClick={() => onCustomerClick(customer)}>
                            <strong>{customer.name}</strong>
                            <p className="villa-info">Villa: {customer.villa}</p>
                            <p className="stay-dates">Stay Dates: {customer.stayDates.start} - {customer.stayDates.end}</p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default CustomerList;