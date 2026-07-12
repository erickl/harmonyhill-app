import React, { useState, useEffect } from 'react';
import * as utils from '../utils.js';
import { Pencil, ShoppingCart, Trash2, CreditCard, Book } from 'lucide-react';
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as userService from "../services/userService.js";
import { useNotification } from "../context/NotificationContext.js";
import MetaInfo from './MetaInfo.js';
import "./BookingComponent.css";

export default function BookingComponent({customer, handleDeleteBooking, context}) {
    const [expanded, setExpanded] = useState(false);

    const { permissions } = useUserPermissions();
    const { onError } = useNotification();

    const handleCustomerClick = () => {
        setExpanded(prev => !prev);
    };

    return (
        <div style={{marginBottom:"0.5rem"}}>
            <div
                className={`customer-list-item ${utils.getHouseColor(customer.house)}`} 
                onClick={() => handleCustomerClick()}
            >
                <div className="customer-name-in-list">
                    <span>{customer.name}</span>
                    <div>
                        <CreditCard
                            className="cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                context.onNavigate('booking-incomes', {
                                    customer : customer,
                                    context : context
                                });
                            }}
                        />
                        <ShoppingCart
                            style={{marginLeft: "1rem"}}
                            className="cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                context.onNavigate('customer-purchases', {
                                    customer : customer,
                                    context : context
                                });
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
            {expanded && (
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
                    { permissions.isAdmin && (<>
                        <p><span className="detail-label">Guest Paid:</span> {utils.formatDisplayPrice(customer.guestPaid)}</p>
                        <p><span className="detail-label">Host Payout:</span> {utils.formatDisplayPrice(customer.hostPayout)}</p>
                    </>)}
                    <div className="booking-component-footer">
                        { permissions.canEditBookings && (
                            <div className="booking-component-footer-icon">
                                <Pencil   
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        context.onNavigate("edit-customer", {customer:customer});
                                    }}
                                />
                                <p>Edit</p>
                            </div>
                        )}

                        { permissions.canDeleteBookings && (
                            <div className="booking-component-footer-icon">
                                <Trash2  
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBooking(customer);
                                    }}
                                />
                                <p>Delete</p>
                            </div>
                        )}
                    </div>
                    <MetaInfo document={customer}/>
                </div>
            )} 
        </div>
    );
}