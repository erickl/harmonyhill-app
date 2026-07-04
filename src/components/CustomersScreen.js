import { useState, useEffect } from 'react';
import * as userService from '../services/userService.js';
import * as utils from '../utils.js';
import './CustomersScreen.css';
import '../App.css';
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useNotification } from "../context/NotificationContext.js";
import { useUserPermissions } from "../context/UserPermissionsContext.js";
import BookingList from "./BookingList.js";

export default function CustomersScreen({ onNavigate, onClose }) {
    const [previousInterval,           setPreviousInterval      ] = useState(null);
    const [futureInterval,             setFutureInterval        ] = useState(null);
    
    const { onError } = useNotification();
    const { permissions } = useUserPermissions();

    useEffect(() => {
        const load = async () => {
            await userService.logLastActive(onError);
        };

        setPreviousInterval({
            checkOutAfter  : utils.today(-5),
            checkOutBefore : utils.today(-1).endOf('day'),
        });

        setFutureInterval({
            checkInAfter  : utils.today(1).startOf('day'),
            checkInBefore : utils.today(14),
        });

        load();
    }, []);

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <h2 className="card-title">Customers</h2>    
                </div>
                <div>
                    { permissions.canAddBookings && (
                        <button className="add-button" onClick={() => onNavigate('add-customer')}>
                            +
                        </button>
                    )}
                </div>
            </div>
            
            <div className="card-content">
                {previousInterval && (<BookingList onNavigate={onNavigate} onClose={onClose} title={"Previous"} filter={previousInterval} /> )}
                <BookingList onNavigate={onNavigate} title={"Current"} onClose={onClose} filter={{date: utils.today().endOf('day')}} expand={true} />
                {futureInterval && (<BookingList onNavigate={onNavigate} onClose={onClose} title={"Future"} filter={futureInterval} /> )}
            </div>
        </div>
    );
};
