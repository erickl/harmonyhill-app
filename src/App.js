import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import CustomersScreen from './components/CustomersScreen';
import ActivitiesScreen from './components/ActivitiesScreen';
import AddExpensesScreen from './components/AddExpensesScreen';
import AddIncomeScreen from './components/AddIncomeScreen';
import LoginScreen from './components/LoginScreen';
import AddCustomerScreen from './components/AddCustomerScreen';
import BottomNavigation from './components/BottomNavigation.js';
import SideMenu from './components/SideMenu.js';

import * as bookingService from './services/bookingService.js';
import * as menuService from './services/menuService.js';
import * as activityService from './services/activityService.js';
import * as invoiceService from './services/invoiceService.js';
import * as userService from './services/userService.js';
import * as personnelService from './services/personnelService.js';
import { DateTime } from 'luxon';
import { auth } from "./firebase";
import { AppProviders } from './components/AppProviders.js';

import './App.css';
//import './models/Dish.js';

function App() {
    //userService.logout();
    //bookingService.uploadData('/Booking list - Bookings Harmony Hill.tsv');
    //bookingService.uploadData('/Booking list - Bookings Jungle Nook.tsv');

    //personnelService.testPersonnel();
    //userService.testLogin();
    //activityService.testActivities(dt);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading,    setLoading]    = useState(true);
    const [activeTab, setActiveTab] = useState('customers');
    const [currentScreen, setCurrentScreen] = useState('customers'); // Added state for screen navigation

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const isApproved = await userService.isUserApproved(user.displayName);
                setIsLoggedIn(isApproved);
            }
            else setIsLoggedIn(false);

            setLoading(false);
        });

        // cleanup to avoid multiple listeners
        return () => unsubscribe();
    }, []);

    const handleTabChange = (tab) => { // For navigation between tabs
        setActiveTab(tab);
        // if (tab !== 'add-customer') { // Don't change screen for add-customer (handled separately)
        //   setCurrentScreen(tab);
        // }
        setCurrentScreen(tab);
    };

    const navigate = (screen) => { // For navigation within a tab
        setCurrentScreen(screen);
    };

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }

    let screenToDisplay;
    if (!isLoggedIn) {
        screenToDisplay = <LoginScreen onLogin={userService.login} onLoginSuccess={navigate} />;
    } else if (currentScreen === 'customers') {
        screenToDisplay = <CustomersScreen onNavigate={navigate} />;
    } else if (currentScreen === 'activities') {
        screenToDisplay = <ActivitiesScreen onNavigate={navigate} />;
    } else if (currentScreen === 'expenses') {
        screenToDisplay = <AddExpensesScreen onNavigate={navigate} />;
    } else if (currentScreen === 'income') {
        screenToDisplay = <AddIncomeScreen onNavigate={navigate} />;
    } else if (currentScreen === 'add-customer') {
        screenToDisplay = <AddCustomerScreen onNavigate={navigate} />;
    }

    return (
        <>
            <div className="app-container">
                {isLoggedIn ? (
                    <>
                        <AppProviders>
                            <SideMenu />
                            <div className="content">
                                {screenToDisplay}
                            </div> { /* Use screenToDisplay */}
                            <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
                        </AppProviders>
                    </>
                ) : (
                    <LoginScreen onLogin={userService.login} onLoginSuccess={setIsLoggedIn} />
                )}
            </div>
        </>
    );
}

export default App;
