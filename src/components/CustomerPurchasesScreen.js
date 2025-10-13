import React, { useState, useEffect } from 'react';
import * as activityService from '../services/activityService.js'; 
import * as mealService from '../services/mealService.js'; 
import * as userService from "../services/userService.js";
import * as invoiceService from '../services/invoiceService.js'; 
import * as utils from "../utils.js";
import AddPurchaseScreen from './AddPurchaseScreen.js';
import EditPurchaseScreen from './EditPurchaseScreen.js';
import './CustomerPurchasesScreen.css'; 
import ActivitiesList from './ActivitiesList.js';
import ConfirmModal from './ConfirmModal.js';
import { useNotification } from "../context/NotificationContext.js";
import InvoicePdfLink from './InvoicePdfLink.js';
import PdfViewer from './PdfViewer.js';

export default function CustomerPurchasesScreen({ customer, onClose, onNavigate }) {
    const [customerPurchasing, setCustomerPurchasing] = useState(null ); // state to enable adding purchases
    const [userIsAdmin,        setUserIsAdmin       ] = useState(false);
    const [showInvoice,        setShowInvoice       ] = useState(false);
    const [total,              setTotal             ] = useState(0);
    const [triggerRerender,    setTriggerRerender   ] = useState(0    );

    const { onError } = useNotification();

    useEffect(() => {
        const setUserRole = async() => {
            const thisUserIsAdmin = await userService.isAdmin();
            setUserIsAdmin(thisUserIsAdmin);
        };

        setUserRole();
    }, []);

    useEffect(() => {
        const getTotal = async() => {
            const total = await invoiceService.getTotal(customer.id);
            setTotal(total.total);
        }
        getTotal();
    }, [triggerRerender]);

    const today = utils.today();

    const handleAddPurchase = (customer) => {
        setCustomerPurchasing(customer); // Indicate we need to switch to add purchase screen
    };

    if(showInvoice) {
        return (<PdfViewer customer={customer} triggerRerender={triggerRerender} onClose={() => setShowInvoice(false)}/>);
    }

    if (customerPurchasing) {
        return (
            <AddPurchaseScreen
                customer={customerPurchasing}
                onClose={() => {     
                    setCustomerPurchasing(null);
                }}
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title"> 
                        Activities<br/>{customer.name}
                    </h2>
                    <p>{customer.checkInAt_wwwddMMM} - {customer.checkOutAt_wwwddMMM}</p>
                </div>
                <div>   
                    {/* Only admins can add purchases to checked out customers */}
                    {(customer.checkOutAt >= today || userIsAdmin) &&  (
                        <button 
                            className="add-button"  
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddPurchase(customer);
                            }}>
                            +
                        </button> 
                    )}
                    <p onClick={() => setShowInvoice(true)}>See invoice ({total} Rp)</p>
                </div>
            </div>
            
            <div className="card-content">
                <ActivitiesList
                    onNavigate={onNavigate}
                    customer={customer}
                    expandAllDates={true}
                    triggerRerender={() => setTriggerRerender(triggerRerender + 1)}
                />  
            </div>
            <button type="button" onClick={() => onClose() } className="cancel-button">
                Back to customers
            </button>
        </div>
    );
};
