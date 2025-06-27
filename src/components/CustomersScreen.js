import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart } from 'lucide-react';
import * as bookingService from '../services/bookingService.js';
import * as userService from '../services/userService.js';
import * as utils from '../utils.js';

import './CustomersScreen.css';
import EditCustomerScreen from './EditCustomerScreen';
import CustomerPurchasesScreen from './CustomerPurchasesScreen.js';

const CustomersScreen = ({ onNavigate }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null); // State to store the selected customer
    const [pastExpanded, setPastExpanded] = useState(false); // State to expand past customer section
    const [futureExpanded, setFutureExpanded] = useState(false); // State to expand future customer section
    const [customerToEdit, setCustomerToEdit] = useState(null); // state to enable editing of customers
    const [customerPurchases, setCustomerPurchases] = useState(null); // state to enable adding purchases
    const [hasEditPermissions, setEditPermissions] = useState(false); // true if current user has persmissions to edit bookings

    const fetchCustomers = async () => {
        try {
            const fetchedCustomers = await bookingService.get();
            setCustomers(fetchedCustomers);
            setLoading(false);
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();

        const loadPermissions = async () => {
            const userHasEditPermissions = await userService.hasEditPermissions();
            setEditPermissions(userHasEditPermissions);
        }
        loadPermissions();    
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

    const today = utils.today();

    const pastCustomers = [];
    const currentCustomers = [];
    const futureCustomers = [];

    customers.forEach(customer => {
        if (customer.checkOutAt < today) {
            pastCustomers.push(customer);
        } else if (customer.checkInAt <= today && customer.checkOutAt >= today) {
            currentCustomers.push(customer);
        } else {
            futureCustomers.push(customer);
        }
    });

    // Function to handle customer click
    const handleCustomerClick = (customer) => {
        if(selectedCustomer?.id === customer?.id) {
            setSelectedCustomer(null);
        } else {
            setSelectedCustomer(customer);
        }
    };

    const handleEditCustomer = (customer) => {
        setCustomerToEdit(customer); // Set the customer to be edited
    };

    const handleEnterPurchasesList = (customer) => {
        setCustomerPurchases(customer); // Indicate we need to switch to customer purchases list screen
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
                                    className={`customer-list-item clickable-item ${utils.getHouseColor(customer.house)}`} // house color calculated
                                    onClick={() => handleCustomerClick(customer)}
                                >
                                    <div className="customer-name-in-list">
                                        <span>{customer.name}</span>
                                        {<ShoppingCart
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEnterPurchasesList(customer);
                                            }}
                                        />}
                                    </div>
                                    {customer.checkInAt_wwwddMMM} - {customer.checkOutAt_wwwddMMM}
                                </div>
                                {selectedCustomer?.id === customer.id && ( // ? is to deal with null/undefined selectedCustomer; *Only* render details for the selected customer
                                    <div className="customer-details">
                                        <p><span className="detail-label">Villa:</span> {utils.capitalizeWords(customer.house)}</p>
                                        <p><span className="detail-label">Length of Stay:</span> {customer.nightsCount} night{customer.nightsCount > 1 ? "s" : ""}</p>
                                        <p><span className="detail-label">Guest Count:</span> {customer.guestCount}</p>
                                        { customer.arrivalInfo && (<p><span className="detail-label">Arrival Information:</span> {customer.arrivalInfo}</p>)}
                                        { customer.dietaryRestrictions && (<p><span className="detail-label">Dietary restrictions: </span><span className="dietaryRestrictions">{customer.dietaryRestrictions}</span></p>)}
                                        { customer.customerInfo && (<p><span className="detail-label">Other Customer Information:</span> {customer.customerInfo}</p>)}
                                        { customer.specialRequests && (<p><span className="detail-label">Special Requests:</span> {customer.specialRequests}</p> )}
                                        { customer.promotions && (<p><span className="detail-label">Promotions:</span> {customer.promotions}</p>)}
                                        <p><span className="detail-label">Country:</span> {utils.capitalizeWords(customer.country)}</p>
                                        <p><span className="detail-label">Source:</span> {customer.source}</p>
                                        { customer.phoneNumber && (<p><span className="detail-label">Phone number:</span> {customer.phoneNumber}</p>)}
                                        { customer.email && ( <p><span className="detail-label">Email:</span> {customer.email}</p> )}
                                        { hasEditPermissions && (
                                            <button
                                                className="edit-booking"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCustomer(customer);
                                                }}> Edit Booking
                                            </button>
                                        )}
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

    const onCustomerEditSubmitted = () => {
        setCustomerToEdit(null);
        fetchCustomers();
    } 

    if (customerToEdit) {
        return (
            <EditCustomerScreen
                customer={customerToEdit}
                onClose={() => onCustomerEditSubmitted()}
                onNavigate={onNavigate}
            />
        );
    }

    if (customerPurchases) {
        return (
            <CustomerPurchasesScreen
                customer={customerPurchases}
                onClose={() => setCustomerPurchases(null)}
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Customers</h2>
                <button className="add-button" onClick={() => onNavigate('add-customer')}>
                    +
                </button>
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