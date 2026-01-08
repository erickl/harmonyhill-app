import { useState, useEffect } from 'react';
import * as userService from '../services/userService.js';
import * as utils from '../utils.js';
import './CustomersScreen.css';
import '../App.css';
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useNotification } from "../context/NotificationContext.js";
import BookingList from "./BookingList.js";

export default function CustomersScreen({ onNavigate, onClose }) {
    const [hasAddBookingsPermissions,  setAddBookingsPermissions] = useState(false );
    const [previousInterval,           setPreviousInterval      ] = useState(null);
    const [futureInterval,             setFutureInterval        ] = useState(null);
    
    const { onError } = useNotification();
    
    const loadPermissions = async () => {
        const userHasAddBookingsPermissions = await userService.hasAddBookingsPermissions();
        setAddBookingsPermissions(userHasAddBookingsPermissions)

        const canSeeAllBookings = await userService.canSeeAllBookings();

        setPreviousInterval({
            checkOutAfter  : canSeeAllBookings ? utils.beginning() : utils.today(-5),
            checkOutBefore : utils.today(-1).endOf('day'),
        });

        setFutureInterval({
            checkInAfter  : utils.today(1).startOf('day'),
            checkInBefore : utils.today(14),
        });
    };

    useEffect(() => {
        const load = async () => {
            await userService.logLastActive(onError);
            await loadPermissions();    
        };

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
                    { hasAddBookingsPermissions && (
                        <button className="add-button" onClick={() => onNavigate('add-customer')}>
                            +
                        </button>
                    )}
                </div>
            </div>
            
            <div className="card-content">
                {previousInterval && (<BookingList onNavigate={onNavigate} onClose={onClose} title={"Previous"} filter={previousInterval} /> )}
                <BookingList onNavigate={onNavigate} title={"Current"} onClose={onClose} filter={{date: utils.today()}} expand={true} />
                {futureInterval && (<BookingList onNavigate={onNavigate} onClose={onClose} title={"Future"} filter={futureInterval} /> )}
            </div>
        </div>
    );
};
