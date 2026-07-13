import React, { useState, useEffect, useRef } from 'react';
import * as bookingService from '../services/bookingService.js';
import { useUserPermissions } from "../context/UserPermissionsContext.js";
import * as utils from '../utils.js';
import { useNotification } from "../context/NotificationContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import * as userService from "../services/userService.js";
import BookingComponent from './BookingComponent.js';
import './BookingList.css';

export default function BookingList({ context, title, filter, expand }) {
    const [sectionIsExpanded, setSectionIsExpanded] = useState(expand || false);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [canSeeAllBookings, setCanSeeAllBookings] = useState(false);

    const seeAllRef = useRef(null);

    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
    const { permissions } = useUserPermissions();

    const title_ = title ? title.toLowerCase() : null;

    const isPrevious = title_ === "previous";
    const isFuture = title_ === "future";
    const doSubscribe = title_ === "current" || title_ === "next month";

    const fetchCustomers = async (getAll = false) => {
        if(doSubscribe) return;

        const filter_ = filter;
        if (getAll) {
            if (isPrevious) {
                delete filter_["checkOutAfter"];
            }
            else if (isFuture) {
                delete filter_["checkInBefore"];
            }
        }
        const customers_ = await bookingService.get(filter_, onError);
        setCustomers(customers_);
        setLoading(false);
    };

    const handleGetAllCustomers = () => {
        if(doSubscribe) return;
        fetchCustomers(true);
    };

    const handleDeleteBooking = async (bookingToDelete) => {
        onConfirm(`Are you sure you want to delete booking ${bookingToDelete.name}?`, async () => {
            if (!bookingToDelete) return;

            const deleteBookingResult = await bookingService.remove(bookingToDelete, onError);
            if (deleteBookingResult !== false) {
                // manual deletion not needed if there's a subscription
                if(doSubscribe) return; 
                let newCustomers = utils.deepCopy(customers);
                newCustomers = newCustomers.filter((customer) => customer.id !== bookingToDelete.id);
                setCustomers(newCustomers);
                onSuccess();
            }
        });
    };

    useEffect(() => {
        // Scroll to the bottom of the previous bookings list (most recent bookings)
        if (isPrevious && seeAllRef.current) {
            seeAllRef.current.scrollIntoView({ behavior: "instant" });
        }
    }, [customers]);

    useEffect(() => {
        if (!sectionIsExpanded) return;
        
        const refresh = isPrevious;
        if (!refresh && customers.length > 0) return;

        const loadPermissions = async () => {
            const canSeeAllBookings_ = await userService.canSeeAllBookings();
            setCanSeeAllBookings(canSeeAllBookings_)
        };

        fetchCustomers();

        loadPermissions();
    }, [sectionIsExpanded]);

    useEffect(() => {
        if(doSubscribe) {
            bookingService.subscribe((liveBookings) => {
                const enhancedLiveBookings = bookingService.enhanceBookings(liveBookings);
                setCustomers(enhancedLiveBookings);
                setLastUpdate(utils.to_HHmm());
                setLoading(false);
            }, filter, onError);
        }
    }, []);

    return (
        <div>
            <h3
                className={`customer-group-header clickable-header`}
                onClick={() => setSectionIsExpanded(!sectionIsExpanded)}
            >
                <div class="customer-group-header-right">
                    {title}
                </div>

                <div className="customer-group-header-right">
                    {lastUpdate && (<>
                        {doSubscribe && (
                            <span className='subscription-notification'>•</span>
                        )}
                        <div className='last-updated-info'>
                            Last updated {lastUpdate}
                        </div>
                    </>)}
                    <span className="expand-icon">
                        {sectionIsExpanded ? ' ▼' : ' ▶'}
                    </span>
                </div>
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
                                    <BookingComponent
                                        customer={customer}
                                        handleDeleteBooking={handleDeleteBooking}
                                        context={context}
                                    />
                                </React.Fragment>
                            )
                        })}

                        {canSeeAllBookings && (title_ !== "current" && title_ !== "next month") && (
                            <button
                                ref={seeAllRef}
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
