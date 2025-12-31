import React, { useState, useEffect } from 'react';
import { Pencil, ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import * as bookingService from '../services/bookingService.js';
import * as userService from '../services/userService.js';
import * as utils from '../utils.js';
import MetaInfo from './MetaInfo.js';
import { useNotification } from "../context/NotificationContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import './BookingList.css';

export default function BookingList({ onNavigate, title, filter, expand}) {
    const [sectionIsExpanded,          setSectionIsExpanded      ] = useState(expand || false);
    const [customers,                  setCustomers              ] = useState([]   );
    const [loading,                    setLoading                ] = useState(true );
    const [hasEditBookingsPermissions, setEditBookingsPermissions] = useState(false);
    const [canSeeAllBookings,          setCanSeeAllBookings      ] = useState(false);
    const [isAdmin,                    setIsAdmin                ] = useState(false);
    const [expandedBookings,           setExpandedBookings       ] = useState({}   );
    
    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
        
    const fetchCustomers = async () => {  
        const customers_ = await bookingService.get(filter, onError);
        setCustomers(customers_);
        setLoading(false);
    };

    const handleGetAllCustomers = () => {
        fetchCustomers(true);
    };

    const handleDeleteBooking = async (bookingToDelete) => {
        onConfirm(`Are you sure you want to delete booking ${bookingToDelete.name}?`, async () => {
            if(!bookingToDelete) return;

            const deleteBookingResult = await bookingService.remove(bookingToDelete.id, onError);
            if(deleteBookingResult !== false) {
                let newCustomers = utils.deepCopy(customers);
                newCustomers = newCustomers.filter((customer) => customer.id !== bookingToDelete.id);
                setCustomers(newCustomers);
                onSuccess();
            }
        });
    };

    const handleCustomerClick = (customer) => {
        const newExpandedBookings = {...(expandedBookings || {})};
        const expand = utils.isEmpty(newExpandedBookings[customer.id]);
        newExpandedBookings[customer.id] = expand ? customer : null;
        setExpandedBookings(newExpandedBookings);
    };

    useEffect(() => {
        const load = async () => {
            await userService.logLastActive(onError);
            const userHasEditBookingsPermissions = await userService.hasEditBookingsPermissions();
            setEditBookingsPermissions(userHasEditBookingsPermissions);

            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);

            const canSeeAllBookings_ = await userService.canSeeAllBookings();
            setCanSeeAllBookings(canSeeAllBookings_)
            
            await fetchCustomers();
        };

        if(sectionIsExpanded) {
            load();
        }
    }, [sectionIsExpanded]);

    return (
        <div>
            <h3
                className={`customer-group-header clickable-header`}
                onClick={() => setSectionIsExpanded(!sectionIsExpanded)} 
            >
                {title}
           
                <span className="expand-icon">
                    {sectionIsExpanded ? ' ▼' : ' ▶'}
                </span>
            </h3>
            {sectionIsExpanded && (<>
                {loading ? (
                    <div className="card-content">
                        <p>Loading customer data...</p>
                    </div>
                ) : (
                    <div>
                        {customers.map((customer) => {
                            return (
                                <React.Fragment key={customer.id}>
                                    <div style={{marginBottom:"0.5rem"}}>
                                        <div
                                            className={`customer-list-item ${utils.getHouseColor(customer.house)}`} 
                                            onClick={() => handleCustomerClick(customer)}
                                        >
                                            <div className="customer-name-in-list">
                                                <span>{customer.name}</span>
                                                <div>
                                                    <CreditCard
                                                        className="cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onNavigate('incomes', {customer});
                                                        }}
                                                    />
                                                    <ShoppingCart
                                                        style={{marginLeft: "1rem"}}
                                                        className="cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onNavigate('customer-purchases', {customer});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="customer-sub-header">
                                                <span className="small-text">{customer.checkInAt_wwwddMMM} - {customer.checkOutAt_wwwddMMM}</span>
                                                {utils.isToday(customer.checkInAt) && (<span className="small-text">Checking In Today</span>)}
                                                {utils.isToday(customer.checkOutAt) && (<span className="small-text">Checking Out Today</span>)}
                                            </div>
                                        </div>
                                        {expandedBookings[customer.id] && (
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
                                                { isAdmin && (<>
                                                    <p><span className="detail-label">Guest Paid:</span> {customer.guestPaid}</p>
                                                    <p><span className="detail-label">Host Payout:</span> {customer.hostPayout}</p>
                                                </>)}
                                                { hasEditBookingsPermissions && (
                                                    <div className="booking-component-footer">
                                                        <div className="booking-component-footer-icon">
                                                            <Pencil   
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onNavigate("edit-customer", {customer});
                                                                }}
                                                            />
                                                            <p>Edit</p>
                                                        </div>
                                    
                                                        <div className="booking-component-footer-icon">
                                                            <Trash2  
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteBooking(customer);
                                                                }}
                                                            />
                                                            <p>Delete</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <MetaInfo document={customer}/>
                                            </div>
                                        )} 
                                    </div>                            
                                </React.Fragment>
                            )
                        })}

                        {canSeeAllBookings && title !== "Current" && (
                            <button
                                className="edit-booking"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGetAllCustomers();
                                }}> See All
                            </button>
                        )}
                    </div>
                )}
            </>)}
        </div>
    );
}
