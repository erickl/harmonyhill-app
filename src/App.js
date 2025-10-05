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
import * as userService from './services/userService.js';
import { auth } from "./firebase";
import './App.css';

function App() {
    const [isLoggedIn,    setIsLoggedIn]    = useState(false);
    const [loading,       setLoading]       = useState(true);
    const [activeTab,     setActiveTab]     = useState('customers');
    const [currentScreen, setCurrentScreen] = useState('customers');

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
                        
                            <SideMenu />
                            <div className="content">
                                {screenToDisplay}
                            </div> { /* Use screenToDisplay */}
                            <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
                        
                    </>
                ) : (
                    <LoginScreen onLogin={userService.login} onLoginSuccess={setIsLoggedIn} />
                )}
            </div>
        </>
    );
}

export default App;
