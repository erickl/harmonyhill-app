import React, { useState } from 'react';
import { Users, List, Upload } from 'lucide-react';

import CustomersScreen from './components/CustomersScreen';
import ActivitiesScreen from './components/ActivitiesScreen';
import ExpensesScreen from './components/ExpensesScreen';
import LoginScreen from './components/LoginScreen';
import * as bookingService from './services/bookingService.js';
import * as menuService from './services/menuService.js';
import * as activityService from './services/activityService.js';
import * as invoiceService from './services/invoiceService.js';
import * as userService from './services/userService.js';

import AddCustomerScreen from './components/AddCustomerScreen';

import './App.css';

// Bottom Navigation Component
const BottomNavigation = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-navigation">
      <button
        className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
        onClick={() => onTabChange('customers')}
      >
        <Users className="h-5 w-5 mb-1" />
        Customers
      </button>
      <button
        className={`nav-button ${activeTab === 'activities' ? 'active' : ''}`}
        onClick={() => onTabChange('activities')}
      >
        <List className="h-5 w-5 mb-1" />
        Activities
      </button>
      <button
        className={`nav-button ${activeTab === 'expenses' ? 'active' : ''}`}
        onClick={() => onTabChange('expenses')}
      >
        <Upload className="h-5 w-5 mb-1" />
        Expenses
      </button>
    </nav>
  );
};




function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(userService.isLoggedIn());
  
  const [activeTab, setActiveTab] = useState('customers');
  const [currentScreen, setCurrentScreen] = useState('customers'); // Added state for screen navigation

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

  let screenToDisplay; // Changed from currentScreen to screenToDisplay
  if(!isLoggedIn) {
    screenToDisplay = <LoginScreen onLogin={userService.login} onLoginSuccess={navigate} />;
  } else if (currentScreen === 'customers') {
    screenToDisplay = <CustomersScreen onNavigate={navigate} />; // Pass navigate
  } else if (currentScreen === 'activities') {
    screenToDisplay = <ActivitiesScreen />;
  } else if (currentScreen === 'expenses') {
    screenToDisplay = <ExpensesScreen />;
  } else if (currentScreen === 'add-customer') {
    screenToDisplay = <AddCustomerScreen onNavigate={navigate} />; // Pass navigate
  }

  return (
    <div className="app-container">
      {isLoggedIn ? (
        <>
            <div className="content">{screenToDisplay}</div> { /* Use screenToDisplay */}
            <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </>
       ) : (
        <LoginScreen onLogin={userService.login} onLoginSuccess={setIsLoggedIn} />
    )}
    </div>
  );
}

export default App;
