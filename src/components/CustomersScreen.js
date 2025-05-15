import React, { useState, useEffect } from 'react';
import * as bookingService from '../services/bookingService.js'; // Import the booking service

import './CustomersScreen.css';

const CustomersScreen = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null); // State to store the selected customer


    // useEffect with argument [] ensures the code is run only once, when the component is first mounted
    // useEffect has to be used when a component interacts with things outside of it; in this case the database
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const fetchedCustomers = await bookingService.get();
                // Modify each customer object to include checkInDate and checkOutDate as Date objects.
                const modifiedCustomers = fetchedCustomers.map(customer => {
                    const checkInDate = new Date(customer.checkInAt.seconds * 1000); //Date constructor expects milliseconds
                    const checkOutDate = new Date(customer.checkOutAt.seconds * 1000);
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

    // Function to render customer list section
    const renderCustomerListSection = (title, customers, customerTypeClass) => {
        if (customers.length === 0) {
            return (
                <div>
                    <h3>{title}</h3>
                    <p>No customers found.</p>
                </div>
            );
        }
        return (
            <div>
                <h3>{title}</h3>
                <div>
                    {customers.map((customer) => (
                        <React.Fragment key={customer.id}>
                            <div
                                className={`customer-list-item clickable-item ${getHouseColor(customer.house)}`} // Added house color
                                onClick={() => handleCustomerClick(customer)}
                            >
                                {customer.name} ~ ({customer.checkInAt.seconds} - {customer.checkOutAt.seconds})
                            </div>
                            {selectedCustomer?.id === customer.id && ( // ? is to deal with null/undefined selectedCustomer; *Only* render details for the selected customer
                                <div className="customer-details">
                                    <p><span className="detail-label">Villa:</span> {customer.house}</p>
                                    <p><span className="detail-label">Check In:</span> {customer.checkInDate.toLocaleDateString()}</p>
                                    <p><span className="detail-label">Check Out:</span> {customer.checkOutDate.toLocaleDateString()}</p>
                                    <p><span className="detail-label">Guest Count:</span> {customer.guestCount}</p>
                                    <p><span className="detail-label">Allergies:</span> <span className="allergies">{customer.allergies}</span></p>
                                    <p><span className="detail-label">Other Details:</span> {customer.otherDetails}</p>
                                    <p><span className="detail-label">Promotions:</span> {customer.promotions}</p>
                                    <p><span className="detail-label">Country:</span> {customer.country}</p>
                                    <p><span className="detail-label">Source:</span> {customer.source}</p>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Customers</h2>
            </div>
            <div className="card-content">
                {/* Past Customers */}
                {renderCustomerListSection("Past Customers", pastCustomers, "past-customer")}

                {/* Current Customers */}
                {renderCustomerListSection("Current Customers", currentCustomers, "current-customer")}

                {/* Future Customers */}
                {renderCustomerListSection("Future Customers", futureCustomers, "future-customer")}



                {/* {customers.length === 0 ? (
                    <p>No customers found.</p>
                ) : (
                    <div>
                        {customers.map((customer) => (
                            <React.Fragment key={customer.id}>
                                <div
                                    className={`customer-list-item clickable-item ${getHouseColor(customer.house)}`} // Added house color
                                    onClick={() => handleCustomerClick(customer)}
                                >
                                    {customer.name} ~ ({customer.checkInAt.seconds} - {customer.checkOutAt.seconds})
                                </div>
                                {selectedCustomer?.id === customer.id && ( // ? is to deal with null/undefined selectedCustomer; *Only* render details for the selected customer
                                    <div className="customer-details">
                                        <p><span className="detail-label">Villa:</span> {customer.house}</p>
                                        <p><span className="detail-label">Check In:</span> {customer.checkInAt.seconds}</p>
                                        <p><span className="detail-label">Check Out:</span> {customer.checkOutAt.seconds}</p>
                                        <p><span className="detail-label">Guest Count:</span> {customer.guestCount}</p>
                                        <p><span className="detail-label">Allergies:</span> <span className="allergies">{customer.allergies}</span></p>
                                        <p><span className="detail-label">Other Details:</span> {customer.otherDetails}</p>
                                        <p><span className="detail-label">Promotions:</span> {customer.promotions}</p>
                                        <p><span className="detail-label">Country:</span> {customer.country}</p>
                                        <p><span className="detail-label">Source:</span> {customer.source}</p>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )} */}

            </div>
        </div>
    );
};

export default CustomersScreen;