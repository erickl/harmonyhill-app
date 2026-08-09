import { useState, useEffect } from 'react';
import * as userService from '../services/userService.js';
import * as utils from '../utils.js';
import './CustomersScreen.css';
import '../App.css';
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useNotification } from "../context/NotificationContext.js";
import { useUserPermissions } from "../context/UserPermissionsContext.js";
import { Filter, FilterX } from 'lucide-react';
import { useFilters } from "../context/FilterContext.js";
import BookingList from "./BookingList.js";
import MyDatePicker from "../components/MyDatePicker.js";

export default function CustomersScreen({ context }) {
    const [customInterval,    setCustomInterval    ] = useState(null);
    const [previousInterval,  setPreviousInterval  ] = useState(null);
    const [nextMonthInterval, setNextMonthInterval ] = useState(null);
    const [futureInterval,    setFutureInterval    ] = useState(null);
    const [showFilter,        setShowFilter        ] = useState(false);
    
    const { onError } = useNotification();
    const { permissions } = useUserPermissions();
    const { onFilter } = useFilters();

    const filterHeaders = {
        "after"  : "date",
        "before" : "date",
    };

    const onFilterValuesSubmit = (filterValues) => {
        setCustomInterval({
            checkOutAfter  : filterValues.after,
            checkOutBefore : filterValues.before
        });
    };

    useEffect(() => {
        const load = async () => {
            await userService.logLastActive(onError);
        };

        setPreviousInterval({
            checkOutAfter  : utils.today(-40),
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
                <div className="card-header-right">
                    <div className="card-header-right-top-row">
                        {customInterval != null && (
                            <FilterX
                                onClick={() => setCustomInterval(null)}
                            />
                        )}
                        {permissions.isAdmin && context.enableFilters && (<>    
                            <Filter 
                                //onClick={() => setShowFilter(prev => !prev)}
                                onClick={() => onFilter(filterHeaders, onFilterValuesSubmit)}
                            />
                        </>)}
                        { permissions.canAddBookings && (
                            <button className="add-button" onClick={() => context.onNavigate('add-customer')}>
                                +
                            </button>
                        )}
                        </div>
                </div>
            </div>
            
            <div className="card-content">
                {customInterval !== null ? (
                    <BookingList 
                        context={context} 
                        title={"Custom"} 
                        filter={customInterval} 
                        expand={true}
                    /> 
                ) : (<>
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
                </>)}
            </div>
        </div>
    );
};
