import { useState, useEffect } from 'react';
import * as userService from '../services/userService.js';
import * as utils from '../utils.js';
import './CustomersScreen.css';
import '../App.css';
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useNotification } from "../context/NotificationContext.js";
import { useUserPermissions } from "../context/UserPermissionsContext.js";
import BookingList from "./BookingList.js";

export default function CustomersScreen({ context }) {
    const [previousInterval,  setPreviousInterval  ] = useState(null);
    const [nextMonthInterval, setNextMonthInterval ] = useState(null);
    const [futureInterval,    setFutureInterval    ] = useState(null);
    
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

        setNextMonthInterval({
            checkInAfter  : utils.today(1).startOf('day'),
            checkOutBefore : utils.today(30).endOf('day'),
        });

        setFutureInterval({
            checkInAfter  : utils.today(30).startOf('day').plus({seconds:-1}),
            checkInBefore : utils.today(90),
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
                        <button className="add-button" onClick={() => context.onNavigate('add-customer')}>
                            +
                        </button>
                    )}
                </div>
            </div>
            
            <div className="card-content">
                {previousInterval && (
                    <BookingList 
                        context={context} 
                        title={"Previous"} 
                        filter={previousInterval} 
                    /> 
                )}

                <BookingList 
                    context={context} 
                    title={"Current"} 
                    filter={{date: utils.today().endOf('day')}} 
                    expand={true} 
                />
                
                {nextMonthInterval && (
                    <BookingList 
                        context={context} 
                        title={"Next Month"} 
                        filter={nextMonthInterval} 
                        expand={true} 
                    /> 
                )}

                {futureInterval && (
                    <BookingList 
                        context={context} 
                        title={"Future"} 
                        filter={futureInterval} 
                    /> 
                )}
            </div>
        </div>
    );
};
