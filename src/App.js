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
import RemoveInventoryScreen from './components/RemoveInventoryScreen.js';
import BottomNavigation from './components/BottomNavigation.js';
import AdminScreen from './components/AdminScreen.js';
import ChangeLogsComponent from "./components/ChangeLogsComponent.js";
import SideMenu from './components/SideMenu.js';
import * as userService from './services/userService.js';
import { auth } from "./firebase.js";
import { useConfirmationModal } from './context/ConfirmationContext.js';
import './App.css';
import AddPurchaseScreen from './components/AddPurchaseScreen.js';
import EditPurchaseScreen from './components/EditPurchaseScreen.js';
import CustomerPurchasesScreen from './components/CustomerPurchasesScreen.js';
import TodoScreen from './components/TodoScreen.js';
import AddTodoScreen from './components/AddTodoScreen.js';

//import * as migrationService from './services/dataMigrationService.js';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([{ name: 'activities', data: {} }]);

    const [activeTab, setActiveTab] = useState('activities');
    const [visitedTabs, setVisitedTabs] = useState(new Set(['activities']));

    const { onConfirm } = useConfirmationModal();

    const bottomNavTabs = ['customers', 'activities', 'expenses', 'incomes'];

    const currentScreen = history[history.length - 1];

    // Push a new screen onto the stack
    const onNavigate = (screenName, screenData = {}) => {
        setHasUnsavedChanges(false);
        setHistory((prev) => [...prev, { name: screenName, data: screenData }]);
    };

    // Pop the top screen off to go back
    const onClose = () => {
        setHasUnsavedChanges(false);
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

        //migrationService.activitiesMigration();

        // cleanup to avoid multiple listeners
        return () => unsubscribe();
    }, []);

    const handleTabChange = (tab) => {
        const onConfirmTabChange = () => {
            setHasUnsavedChanges(false);
            setActiveTab(tab);
            setVisitedTabs(prev => new Set([...prev, tab]));
            // Tabs are the top of hierarchy, so clear history
            setHistory([{ name: tab, data: {} }]);
        }

        if (hasUnsavedChanges) {
            onConfirm(`You have unsaved changes. Are you sure you want to close?`, () => {
                onConfirmTabChange();
            })
        } else {
            onConfirmTabChange();
        }
    };

    if (loading) {
        return (
            <p>Loading...</p>
        )
    }

    const SCREENS = {
        'customers': CustomersScreen,
        'add-customer': AddCustomerScreen,
        'edit-customer': EditCustomerScreen,
        'activities': ActivitiesScreen,
        'expenses': ExpensesScreen,
        'add-expense': AddExpensesScreen,
        'edit-expense': AddExpensesScreen,
        'incomes': IncomeScreen,
        // Same income screen, but not entered from the bottom tab nav bar
        'booking-incomes': IncomeScreen,
        'add-income': AddIncomeScreen,
        'edit-income': AddIncomeScreen,
        'customer-purchases': CustomerPurchasesScreen,
        'add-customer-purchase': AddPurchaseScreen,
        'edit-customer-purchase': EditPurchaseScreen,
        'admin': AdminScreen,
        'userLogs': ChangeLogsComponent,
        'inventory': InventoryScreen,
        'addInventory': AddInventoryScreen,
        'removeInventory': RemoveInventoryScreen,
        'todo-list': TodoScreen,
        'add-todo': AddTodoScreen,
    };

    const ScreenToDisplay = SCREENS[currentScreen.name];
    const isBottomNavTab = bottomNavTabs.includes(currentScreen.name);

    const context = {
        onNavigate: onNavigate,
        onClose: onClose,
        setHasUnsavedChanges: setHasUnsavedChanges
    }

    return (
        <div className="app-container">
            {isLoggedIn ? (<>
                <SideMenu context={context} />

                {/* Active screen is not one of the bottom nav tabs */}
                {!isBottomNavTab && (
                    <div className="content">
                        <ScreenToDisplay
                            context={context}
                            {...currentScreen.data}
                        />
                    </div>
                )}

                {/* Always keep the bottom nav tabs (main screens) in cache */}
                <div className="content" style={{ display: isBottomNavTab && activeTab === 'customers' ? 'block' : 'none' }}>
                    {visitedTabs.has('customers') &&
                        <CustomersScreen
                            context={context}
                        />
                    }
                </div>
                <div className="content" style={{ display: isBottomNavTab && activeTab === 'activities' ? 'block' : 'none' }}>
                    {visitedTabs.has('activities') &&
                        <ActivitiesScreen
                            context={context}
                        />
                    }
                </div>
                <div className="content" style={{ display: isBottomNavTab && activeTab === 'expenses' ? 'block' : 'none' }}>
                    {visitedTabs.has('expenses') &&
                        <ExpensesScreen
                            context={context}
                        />
                    }
                </div>

                <div className="content" style={{ display: isBottomNavTab && activeTab === 'incomes' ? 'block' : 'none' }}>
                    {visitedTabs.has('incomes') &&
                        <IncomeScreen
                            context={context}
                        />
                    }
                </div>

                <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            </>) : (
                <LoginScreen onLogin={userService.login} onLoginSuccess={setIsLoggedIn} />
            )}
        </div>
    );
}

export default App;
