import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import CustomersScreen from './components/CustomersScreen.js';
import ActivitiesScreen from './components/ActivitiesScreen.js';
import AddExpensesScreen from './components/AddExpensesScreen.js';
import ExpensesScreen from './components/ExpensesScreen.js';
import AddIncomeScreen from './components/AddIncomeScreen.js';
import IncomeScreen from './components/IncomeScreen.js';
import LoginScreen from './components/LoginScreen.js';
import AddCustomerScreen from './components/AddCustomerScreen.js';
import EditCustomerScreen from './components/EditCustomerScreen.js';
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
import AddPurchaseScreen from './components/AddPurchaseScreen.js';
import EditPurchaseScreen from './components/EditPurchaseScreen.js';
import CustomerPurchasesScreen from './components/CustomerPurchasesScreen.js';

function App() {
    const [isLoggedIn, setIsLoggedIn         ] = useState(false      );
    const [loading,    setLoading            ] = useState(true       );
    const [history,    setHistory            ] = useState([{ name: 'customers', data: {} }]);
    const [activeTab,  setActiveTab          ] = useState('customers');

    const currentScreen = history[history.length - 1];

    // Push a new screen onto the stack
    const navigate = (screenName, screenData = {}) => {
        setHistory((prev) => [...prev, { name: screenName, data: screenData }]);
    };

    // Pop the top screen off to go back
    const onClose = () => {
        if (history.length > 1) {
            setHistory((prev) => prev.slice(0, -1));
        }
    };

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

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Tabs are the top of hierarchy, so clear history
        setHistory([{ name: tab, data: {} }]);
    };

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }

    const SCREENS = {
        'customers'              : CustomersScreen,
        'add-customer'           : AddCustomerScreen,
        'edit-customer'          : EditCustomerScreen,
        'activities'             : ActivitiesScreen,
        'expenses'               : ExpensesScreen,
        'add-expense'            : AddExpensesScreen,
        'edit-expense'           : AddExpensesScreen,
        'incomes'                : IncomeScreen,
        'add-income'             : AddIncomeScreen,
        'edit-income'            : AddIncomeScreen,
        'customer-purchases'     : CustomerPurchasesScreen,
        'add-customer-purchase'  : AddPurchaseScreen,
        'edit-customer-purchase' : EditPurchaseScreen,
        'admin'                  : AdminScreen,
        'userLogs'               : ChangeLogsComponent,
        'inventory'              : InventoryScreen,
        'addInventory'           : AddInventoryScreen,
        'subtractInventory'      : SubtractInventoryScreen,
    };

    const ScreenToDisplay = SCREENS[currentScreen.name];

    return (
        <div className="app-container">   
            {isLoggedIn ? (<>                     
                    <SideMenu onNavigate={navigate}/>
                    <div className="content">
                        <ScreenToDisplay
                            onNavigate={navigate} 
                            onClose={onClose}
                            {...currentScreen.data}
                        />
                    </div> { /* Use screenToDisplay */}
                    <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />        
            </>) : (
                <LoginScreen onLogin={userService.login} onLoginSuccess={setIsLoggedIn} />
            )}
        </div>
    );
}

export default App;
