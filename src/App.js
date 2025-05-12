import React, { useState } from 'react';
import './App.css';
import CustomerList from './components/CustomerList';
import AddCustomer from './components/AddCustomer';
import CustomerTab from './components/CustomerTab';

import * as bookingService from "./services/bookingService.js"; 

function App() {

  // Dummy customers
  const [customers, setCustomers] = useState([
    {
      id: '1',
      name: 'Alice Smith',
      guests: 2,
      villa: 'Jungle Nook',
      stayDates: { start: '2025-05-10', end: '2025-05-15' },
      purchases: [],
      promotions: '', // Free text for promotions
      source: 'AirBnB',
      allergies: 'None',
      country: 'USA',
      otherDetails: 'Arriving late.',
    },
    {
      id: '2',
      name: 'Bob Johnson',
      guests: 1,
      villa: 'Harmony Hill',
      stayDates: { start: '2025-05-12', end: '2025-05-18' },
      purchases: [],
      promotions: 'Loyalty Discount applied', // Free text for promotions
      source: 'Direct',
      allergies: 'Peanuts',
      country: 'Canada',
      otherDetails: 'Requested extra towels.',
    },
    {
      id: '3',
      name: 'Charlie Brown',
      guests: 4,
      villa: 'Jungle Nook',
      stayDates: { start: '2025-05-15', end: '2025-05-22' },
      purchases: [],
      promotions: 'Early Bird Special', // Free text for promotions
      source: 'AirBnB',
      allergies: 'Shellfish',
      country: 'UK',
      otherDetails: 'Celebrating a birthday.',
    },
  ]);

  // Enable opening a specific customer tab
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
  };

  // What to do when a customer is added
  const handleAddCustomer = (newCustomer) => {
    setCustomers([...customers, newCustomer]);
    // Optionally, you might want to clear the selected customer
    // setSelectedCustomer(null);
  };

  // Adding purchases
  const handleAddPurchaseToCustomer = (customerId, newPurchase) => {
    setCustomers(prevCustomers =>
      prevCustomers.map(customer => {
        if (customer.id === customerId) {
          return {
            ...customer,
            purchases: [...customer.purchases, newPurchase],
          };
        }
        return customer;
      })
    );
    // Optionally, keep the selected customer highlighted
    setSelectedCustomer(prevSelectedCustomer =>
      prevSelectedCustomer && prevSelectedCustomer.id === customerId
        ? { ...prevSelectedCustomer, purchases: [...prevSelectedCustomer.purchases, newPurchase] }
        : prevSelectedCustomer
    );
  };

  return (
    <div>
      <h1>Harmony Hill App</h1>
      <CustomerList customers={customers} onCustomerClick={handleCustomerClick} />

      {selectedCustomer && (
        <CustomerTab customer={selectedCustomer} onPurchaseAdded={handleAddPurchaseToCustomer} />
      )}

      <AddCustomer onCustomerAdded={handleAddCustomer} />


    </div>
  );
}

export default App;