import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart } from 'lucide-react';
import * as bookingService from '../services/bookingService.js'; // Import the booking service
import * as utils from '../utils.js';

import './CustomersScreen.css';
import AddCustomerScreen from './AddCustomerScreen';
import EditCustomerScreen from './EditCustomerScreen';
import AddPurchaseScreen from './AddPurchaseScreen.js';

const CustomersScreen = ({ onNavigate }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null); // State to store the selected customer
    const [pastExpanded, setPastExpanded] = useState(false); // State to expand past customer section
    const [futureExpanded, setFutureExpanded] = useState(false); // State to expand future customer section
    const [customerToEdit, setCustomerToEdit] = useState(null); // state to enable editing of customers
    const [customerPurchasing, setCustomerPurchasing] = useState(null); // state to enable adding purchases


    // useEffect with argument [] ensures the code is run only once, when the component is first mounted
    // useEffect has to be used when a component interacts with things outside of it; in this case the database
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const fetchedCustomers = await bookingService.get();
                // Modify each customer object to include checkInDate and checkOutDate as Date objects.
                const modifiedCustomers = fetchedCustomers.map(customer => {
                    const checkInDate = utils.dateStringToDate(customer.checkInAt); //Date constructor expects milliseconds
                    const checkOutDate = utils.dateStringToDate(customer.checkOutAt);
                    checkInDate.setHours(0, 0, 0, 0);
                    checkOutDate.setHours(0, 0, 0, 0);
                    return {
                        ...customer,
                        checkInDate: checkInDate, // Store the Date object
                        checkOutDate: checkOutDate, // Store the Date object
                    };
                });
                setCustomers(modifiedCustomers);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };


        fetchCustomers();
    }, []);

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Loading Customers...</h2>
                </div>
                <div className="card-content">
                    <p>Loading customer data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Error</h2>
                </div>
                <div className="card-content">
                    <p>Error: {error.message}</p>
                </div>
            </div>
        );
    }

    // Logic to group customers into Past / Current / Future
    // Once checkInAt is updated to a string, this needs to be adjusted

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastCustomers = [];
    const currentCustomers = [];
    const futureCustomers = [];

    customers.forEach(customer => {
        // const checkInDate = new Date(customer.checkInAt.seconds);
        // const checkOutDate = new Date(customer.checkOutAt.seconds);
        // checkInDate.setHours(0, 0, 0, 0);
        // checkOutDate.setHours(0, 0, 0, 0);

        if (customer.checkOutDate < today) {
            pastCustomers.push(customer);
        } else if (customer.checkInDate <= today && customer.checkOutDate >= today) {
            currentCustomers.push(customer);
        } else {
            futureCustomers.push(customer);
        }
    });

    // Function to handle customer click
    const handleCustomerClick = (customer) => {
        setSelectedCustomer(customer);
    };

    const handleEditCustomer = (customer) => {
        setCustomerToEdit(customer); // Set the customer to be edited
    };

    const handleAddPurchase = (customer) => {
        setCustomerPurchasing(customer); // Indicate we need to switch to add purchase screen
    };

    const getHouseColor = (house) => {
        switch (house) {
            case 'The Jungle Nook':
                return 'bg-jn'; // Tailwind CSS class for light blue
            case 'Harmony Hill':
                return 'bg-hh'; // Tailwind CSS class for light green
            default:
                return ''; // No background color by default
        }
    };

    // Function to render previous / current /  future customer list section
    const renderCustomerListSection = (title, customers, customerTypeClass, isExpanded, setIsExpanded) => {
        const hasCustomers = customers.length > 0;
        return (
            <div>
                <h3
                    className={`customer-group-header ${hasCustomers ? 'clickable-header' : ''}`}
                    onClick={() => hasCustomers && setIsExpanded(!isExpanded)} //if it has customers inside, toggle the visibility
                >
                    {title}
                    {hasCustomers && customerTypeClass != "current-customer" && (
                        <span className="expand-icon">
                            {isExpanded ? ' ▼' : ' ▶'} {/* Added expand/collapse icon */}
                        </span>
                    )}
                </h3>
                {isExpanded && hasCustomers ? (
                    <div>
                        {customers.map((customer) => (
                            <React.Fragment key={customer.id}>
                                <div
                                    className={`customer-list-item clickable-item ${getHouseColor(customer.house)}`} // house color calculated
                                    onClick={() => handleCustomerClick(customer)}
                                >
                                    <div className="customer-name-in-list">
                                        <span>{customer.name}</span>
                                        {<ShoppingCart
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddPurchase(customer);
                                            }}
                                        />}
                                    </div>
                                    {customer.checkInDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {customer.checkOutDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                </div>
                                {selectedCustomer?.id === customer.id && ( // ? is to deal with null/undefined selectedCustomer; *Only* render details for the selected customer
                                    <div className="customer-details">
                                        <p><span className="detail-label">Villa:</span> {customer.house}</p>
                                        <p><span className="detail-label">Check In:</span> {customer.checkInDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p><span className="detail-label">Check Out:</span> {customer.checkOutDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p><span className="detail-label">Length of Stay:</span> {(customer.checkOutDate - customer.checkInDate) / (1000 * 60 * 60 * 24)} nights</p>
                                        <p><span className="detail-label">Guest Count:</span> {customer.guestCount}</p>
                                        <p><span className="detail-label">Allergies: </span><span className="allergies">{customer.allergies}</span></p>
                                        <p><span className="detail-label">Other Details:</span> {customer.otherDetails}</p>
                                        <p><span className="detail-label">Promotions:</span> {customer.promotions}</p>
                                        <p><span className="detail-label">Country:</span> {customer.country}</p>
                                        <p><span className="detail-label">Source:</span> {customer.source}</p>
                                        <button
                                            className="edit-booking"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditCustomer(customer);
                                            }}> Edit Booking
                                        </button>
                                    </div>

                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    null
                )}
            </div>
        );
    };

    if (customerToEdit) {
        return (
            <EditCustomerScreen
                customer={customerToEdit}
                onClose={() => setCustomerToEdit(null)}
                onNavigate={onNavigate}
            />
        );
    }

    if (customerPurchasing) {
        return (
            <AddPurchaseScreen
                customer={customerPurchasing}
                onClose={() => setCustomerPurchasing(null)}
                onNavigate={onNavigate}
            />
        );
    }



    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Customers
                    <button className="add-customer-button" onClick={() => onNavigate('add-customer')}>
                        +
                    </button></h2>
            </div>
            <div className="card-content">
                {/* Past Customers */}
                {renderCustomerListSection("Past Customers", pastCustomers, "past-customer", pastExpanded, setPastExpanded)}

                {/* Current Customers */}
                {renderCustomerListSection("Current Customers", currentCustomers, "current-customer", true, () => { })} {/* Always expanded */}

                {/* Future Customers */}
                {renderCustomerListSection("Future Customers", futureCustomers, "future-customer", futureExpanded, setFutureExpanded)}

            </div>
        </div>
    );
};

export default CustomersScreen;