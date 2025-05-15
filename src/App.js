import React, { useState } from 'react';
import { Users, List, Upload } from 'lucide-react';

import CustomersScreen from './components/CustomersScreen';
import ActivitiesScreen from './components/ActivitiesScreen';
import ExpensesScreen from './components/ExpensesScreen';

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
  const [activeTab, setActiveTab] = useState('customers');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  let currentScreen;
  if (activeTab === 'customers') {
    currentScreen = <CustomersScreen />;
  } else if (activeTab === 'activities') {
    currentScreen = <ActivitiesScreen />;
  } else if (activeTab === 'expenses') {
    currentScreen = <ExpensesScreen />;
  }

  return (
    <div className="app-container">
      <div className="content">{currentScreen}</div>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;
