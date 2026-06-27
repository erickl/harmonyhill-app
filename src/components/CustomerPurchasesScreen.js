import React, { useState, useEffect } from 'react';
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import * as invoiceService from '../services/invoiceService.js'; 
import * as utils from "../utils.js";
import './CustomerPurchasesScreen.css'; 
import ActivitiesList from './ActivitiesList.js';
import { useNotification } from "../context/NotificationContext.js";
import PdfViewer from './PdfViewer.js';

export default function CustomerPurchasesScreen({ customer, onClose, onNavigate }) {
    const [showInvoice,        setShowInvoice       ] = useState(false);
    const [total,              setTotal             ] = useState(0);
    const [triggerRerender,    setTriggerRerender   ] = useState(0);

    const { onError } = useNotification();
    const { permissions } = useUserPermissions();

    useEffect(() => {
        const getTotal = async() => {
            const total = await invoiceService.getTotal(customer.id, onError);
            setTotal(total.total);
        }
        getTotal();
    }, [triggerRerender]);

    const today = utils.today();

    if(showInvoice) {
        return (<PdfViewer customer={customer} triggerRerender={triggerRerender} onClose={() => setShowInvoice(false)}/>);
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
                    {(customer.checkOutAt >= today || permissions.isAdmin) &&  (
                        <button 
                            className="add-button"  
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigate("add-customer-purchase", {customer:customer});
                            }}>
                            +
                        </button> 
                    )}
                    <p onClick={() => setShowInvoice(true)}>See invoice ({utils.formatDisplayPrice(total)} Rp)</p>
                </div>
            </div>
            
            <div className="card-content">
                <ActivitiesList
                    onNavigate={onNavigate}
                    onClose={onClose}
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
