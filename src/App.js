import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Users, List, Upload } from 'lucide-react';

import CustomersScreen from './components/CustomersScreen';
import ActivitiesScreen from './components/ActivitiesScreen';
import ExpensesScreen from './components/ExpensesScreen';
import LoginScreen from './components/LoginScreen';
import AddCustomerScreen from './components/AddCustomerScreen';

import * as bookingService from './services/bookingService.js';
import * as menuService from './services/menuService.js';
import * as activityService from './services/activityService.js';
import * as invoiceService from './services/invoiceService.js';
import * as userService from './services/userService.js';
import * as personnelService from './services/personnelService.js';
import { DateTime } from 'luxon';
import { auth } from "./firebase";


import './App.css';

// Bottom Navigation Component
const BottomNavigation = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-navigation">
      {/* <button
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
      </button> */}
    </nav>
  );
};




function App() {
  //bookingService.uploadData('/Booking list - Bookings Harmony Hill.tsv');
  //bookingService.uploadData('/Booking list - Bookings Jungle Nook.tsv');
  
  //personnelService.testPersonnel();
  //userService.testLogin();
  //activityService.testActivities(dt);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const [currentScreen, setCurrentScreen] = useState('customers'); // Added state for screen navigation

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user); 
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

  let screenToDisplay;
  if (!isLoggedIn) {
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
