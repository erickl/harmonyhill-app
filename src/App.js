import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import CustomersScreen from './components/CustomersScreen.js';
import ActivitiesScreen from './components/ActivitiesScreen.js';
import AddExpensesScreen from './components/AddExpensesScreen.js';
import AddIncomeScreen from './components/AddIncomeScreen.js';
import LoginScreen from './components/LoginScreen.js';
import AddCustomerScreen from './components/AddCustomerScreen.js';
import InventoryScreen from './components/InventoryScreen.js';
import AddInventoryScreen from './components/AddInventoryScreen.js';
import SubtractInventoryScreen from './components/SubtractInventoryScreen.js';
import BottomNavigation from './components/BottomNavigation.js';
import AdminScreen from './components/AdminScreen.js';
import ChangeLogsComponent from "./components/ChangeLogsComponent.js";
import SideMenu from './components/SideMenu.js';
import * as userService from './services/userService.js';
import { auth } from "./firebase.js";
import './App.css';

function App() {
    const [isLoggedIn,          setIsLoggedIn         ] = useState(false      );
    const [loading,             setLoading            ] = useState(true       );
    const [activeTab,           setActiveTab          ] = useState('customers');
    const [currentScreen,       setCurrentScreen      ] = useState('customers');
    const [currentScreenParams, setCurrentScreenParams] = useState(null       );

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

    const navigate = (screen, params = null) => { 
        setCurrentScreen(screen);
        setCurrentScreenParams(params);
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
    } else if (currentScreen === 'admin') {
        screenToDisplay = <AdminScreen onNavigate={navigate} />;
    } else if (currentScreen === 'userLogs') {
        screenToDisplay = <ChangeLogsComponent onNavigate={navigate} />;
    } else if(currentScreen === "inventory") {
        screenToDisplay = <InventoryScreen onNavigate={navigate} />;
    } else if(currentScreen === "addInventory") {
        screenToDisplay = <AddInventoryScreen onNavigate={navigate} onClose={() => navigate("inventory")} {...currentScreenParams} />;
    } else if(currentScreen === "subtractInventory") {
        screenToDisplay = <SubtractInventoryScreen onNavigate={navigate} onClose={() => navigate("inventory")} {...currentScreenParams} />;
    }

    return (
        <>
            <div className="app-container">   
                {isLoggedIn ? (
                    <>
                        
                            <SideMenu onNavigate={navigate}/>
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
