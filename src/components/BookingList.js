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
    const [canSeeAllBookings, setCanSeeAllBookings] = useState(false);

    const seeAllRef = useRef(null);

    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
    const { permissions } = useUserPermissions();

    const isPrevious = title.toLowerCase() === "previous";
    const isFuture = title.toLowerCase() === "future";

    const fetchCustomers = async (getAll = false) => {
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
        fetchCustomers(true);
    };

    const handleDeleteBooking = async (bookingToDelete) => {
        onConfirm(`Are you sure you want to delete booking ${bookingToDelete.name}?`, async () => {
            if (!bookingToDelete) return;

            const deleteBookingResult = await bookingService.remove(bookingToDelete.id, onError);
            if (deleteBookingResult !== false) {
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
        if (customers.length > 0) return;

        const loadPermissions = async () => {
            const canSeeAllBookings_ = await userService.canSeeAllBookings();
            setCanSeeAllBookings(canSeeAllBookings_)
        };

        fetchCustomers();

        loadPermissions();
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
                                    <BookingComponent
                                        customer={customer}
                                        handleDeleteBooking={handleDeleteBooking}
                                        context={context}
                                    />
                                </React.Fragment>
                            )
                        })}

                        {canSeeAllBookings && title !== "Current" && (
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
