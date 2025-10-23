import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart, Trash2 } from 'lucide-react';
import * as bookingService from '../services/bookingService.js';
import * as userService from '../services/userService.js';
import * as utils from '../utils.js';
import ErrorNoticeModal from './ErrorNoticeModal.js';
import './CustomersScreen.css';
import '../App.css';
import EditCustomerScreen from './EditCustomerScreen.js';
import CustomerPurchasesScreen from './CustomerPurchasesScreen.js';
import ConfirmModal from './ConfirmModal.js';
import VeganHamburgerButton from './VeganHamburgerButton.js';
import MetaInfo from './MetaInfo.js';
import { useNotification } from "../context/NotificationContext.js";

const CustomersScreen = ({ onNavigate }) => {
    const [customers,                  setCustomers]               = useState([]    );
    const [loading,                    setLoading]                 = useState(true  );
    const [selectedCustomer,           setSelectedCustomer]        = useState(null  ); // State to store the selected customer
    const [pastExpanded,               setPastExpanded]            = useState(false ); // State to expand past customer section
    const [futureExpanded,             setFutureExpanded]          = useState(false ); // State to expand future customer section
    const [customerToEdit,             setCustomerToEdit]          = useState(null  ); // state to enable editing of customers
    const [customerPurchases,          setCustomerPurchases]       = useState(null  ); // state to enable adding purchases
    const [hasEditBookingsPermissions, setEditBookingsPermissions] = useState(false ); // true if current user has permissions to edit bookings
    const [hasAddBookingsPermissions,  setAddBookingsPermissions]  = useState(false ); // true if current user has permissions to add bookings
    const [canSeeAllBookings,          setCanSeeAllBookings]       = useState(false ); // true if current user can see all future/past bookings or just the closest ones
    const [errorMessage,               setErrorMessage]            = useState(null  );
    const [bookingToDelete,            setBookingToDelete]         = useState(null  );

    const { onError, onWarning } = useNotification();

    const loadPermissions = async () => {
        const userHasEditBookingsPermissions = await userService.hasEditBookingsPermissions();
        setEditBookingsPermissions(userHasEditBookingsPermissions);

        const userHasAddBookingsPermissions = await userService.hasEditBookingsPermissions();
        setAddBookingsPermissions(userHasAddBookingsPermissions)

        const canSeeAllBookings = await userService.canSeeAllBookings();
        setCanSeeAllBookings(canSeeAllBookings);
    };

    const fetchCustomers = async (getAllCustomers = false) => {
        try {
            let customerFilter = { after: utils.today(-2), before: utils.today(7) };
            
            // cant rely on async state here. Fetch again
            const userCanSeeAllBookings = await userService.canSeeAllBookings(); 
            if(userCanSeeAllBookings) {
                if(getAllCustomers) {
                    customerFilter = {}
                } else {
                    customerFilter = { after: utils.today(-7), before: utils.today(14) };
                }
            }
            
            const fetchedCustomers = await bookingService.get(customerFilter, onError);
            setCustomers(fetchedCustomers);
            setLoading(false);
        } catch (err) {
            onError(`Error fetching customers: ${err.message}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            await userService.logLastActive(onError);
            await loadPermissions();    
            await fetchCustomers(false);
        };

        load();
    }, [bookingToDelete, customerToEdit]);

    if (loading) {
        return (
            <div className="fullscreen">
                <div className="card-header">
                    <div className='card-header-left'>
                        <VeganHamburgerButton />
                        <h2 className="card-title">Customers</h2>    
                    </div>
                </div>
                <div className="card-content">
                    <p>Loading customer data...</p>
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

    const handleDeleteBooking = async () => {
        if(!bookingToDelete) return;
        const deleteBookingResult = await bookingService.remove(bookingToDelete.id, onError);
        if(deleteBookingResult) {
            setBookingToDelete(null);
        }
    };

    const handleEditCustomer = (customer) => {
        setCustomerToEdit(customer);
    };

    const handleGetAllCustomers = () => {
        fetchCustomers(true);
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
                                        <ShoppingCart
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEnterPurchasesList(customer);
                                            }}
                                        />
                                    </div>
                                    <div class="customer-sub-header">
                                        <span class="small-text">{customer.checkInAt_wwwddMMM} - {customer.checkOutAt_wwwddMMM}</span>
                                        {utils.isToday(customer.checkInAt) && (<span class="small-text">Checking In Today</span>)}
                                        {utils.isToday(customer.checkOutAt) && (<span class="small-text">Checking Out Today</span>)}
                                    </div>
                                </div>
                                {selectedCustomer?.id === customer.id && ( // ? is to deal with null/undefined selectedCustomer; *Only* render details for the selected customer
                                    <div className="customer-details">
                                        <p><span className="detail-label">Villa:</span> {utils.capitalizeWords(customer.house)}</p>
                                        <p><span className="detail-label">Length of Stay:</span> {customer.nightsCount} night{customer.nightsCount > 1 ? "s" : ""}</p>
                                        <p><span className="detail-label">Guest Count:</span> {customer.guestCount}</p>
                                        { customer.arrivalInfo && (<p><span className="detail-label">Arrival Information:</span> {customer.arrivalInfo}</p>)}
                                        { customer.dietaryRestrictions && (
                                            <p>
                                                <span className="detail-label">Dietary restrictions: </span> {" "}
                                                <span className="important-badge">{customer.dietaryRestrictions}</span>
                                            </p>
                                        )}
                                        { customer.customerInfo && (<p><span className="detail-label">Other Customer Information:</span> {customer.customerInfo}</p>)}
                                        { customer.specialRequests && (<p><span className="detail-label">Special Requests:</span> {customer.specialRequests}</p> )}
                                        { customer.promotions && (
                                            <p>
                                                <span className="detail-label">Promotions:</span> {" "}
                                                <span className="important-badge">{customer.promotions}</span>
                                            </p>
                                        )}
                                        <p><span className="detail-label">Country:</span> {utils.capitalizeWords(customer.country)}</p>
                                        <p><span className="detail-label">Source:</span> {utils.capitalizeWords(customer.source)}</p>
                                        { customer.phoneNumber && (<p><span className="detail-label">Phone number:</span> {customer.phoneNumber}</p>)}
                                        { customer.email && ( <p><span className="detail-label">Email:</span> {customer.email}</p> )}
                                        { hasEditBookingsPermissions && (
                                            <div className="booking-component-footer">
                                                <div className="booking-component-footer-icon">
                                                    <Pencil   
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditCustomer(customer);
                                                        }}
                                                    />
                                                    <p>Edit</p>
                                                </div>
                            
                                                <div className="booking-component-footer-icon">
                                                    <Trash2  
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setBookingToDelete(customer);
                                                        }}
                                                    />
                                                    <p>Delete</p>
                                                </div>
                                            </div>
                                        )}
                                        <MetaInfo document={customer}/>
                                    </div>
                                )}                             
                            </React.Fragment>
                        ))}
                        {(canSeeAllBookings && (customerTypeClass == "past-customer" || customerTypeClass == "future-customer") &&
                            <button
                                className="edit-booking"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGetAllCustomers();
                                }}> See All
                            </button>
                        )}
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
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <h2 className="card-title">Customers</h2>    
                </div>
                <div>
                    { hasAddBookingsPermissions && (
                        <button className="add-button" onClick={() => onNavigate('add-customer')}>
                            +
                        </button>
                    )}
                </div>
            </div>
            <div className="card-content">
                {/* Past Customers */}
                {renderCustomerListSection("Past Customers", pastCustomers, "past-customer", pastExpanded, setPastExpanded)}

                {/* Current Customers */}
                {renderCustomerListSection("Current Customers", currentCustomers, "current-customer", true, () => { })} {/* Always expanded */}

                {/* Future Customers */}
                {renderCustomerListSection("Future Customers", futureCustomers, "future-customer", futureExpanded, setFutureExpanded)}

            </div>

            {bookingToDelete && (
                <ConfirmModal 
                    onCancel={() => setBookingToDelete(null)}
                    onConfirm={handleDeleteBooking}
                />
            )}

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
};

export default CustomersScreen;