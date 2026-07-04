import React, { useState, useEffect } from 'react';
import * as bookingService from '../services/bookingService.js';
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as utils from '../utils.js';
import { useNotification } from "../context/NotificationContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import * as userService from "../services/userService.js";
import BookingComponent from './BookingComponent.js';
import './BookingList.css';

export default function BookingList({ onNavigate, onClose, title, filter, expand}) {
    const [sectionIsExpanded,          setSectionIsExpanded      ] = useState(expand || false);
    const [customers,                  setCustomers              ] = useState([]   );
    const [loading,                    setLoading                ] = useState(true );
    const [canSeeAllBookings,          setCanSeeAllBookings      ] = useState(false);
    
    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
    const { permissions } = useUserPermissions();
        
    const fetchCustomers = async (getAll = false) => {  
        const customers_ = await bookingService.get(getAll ? {} : filter, onError);
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

    useEffect(() => {
        const load = async () => {
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
                                    <BookingComponent
                                        customer={customer}
                                        handleDeleteBooking={handleDeleteBooking}
                                        onNavigate={onNavigate}
                                    />
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
