
import React from 'react';
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import { Users, List, Upload, Download } from 'lucide-react';
import '../App.css';

export default function BottomNavigation({ activeTab, onTabChange }) {
    const { permissions } = useUserPermissions();

    return (
        <nav className="bottom-navigation">
            
            {permissions.canReadBookings && (
                <button
                    className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
                    onClick={() => onTabChange('customers')}
                >
                    <Users className="h-5 w-5 mb-1" />
                    Customers
                </button>
            )}

            {permissions.canReadActivities && (
                <button
                    className={`nav-button ${activeTab === 'activities' ? 'active' : ''}`}
                    onClick={() => onTabChange('activities')}
                >
                    <List className="h-5 w-5 mb-1" />
                    Activities
                </button>
            )}

            {permissions.canReadExpenses && (
                <button
                    className={`nav-button ${activeTab === 'expenses' ? 'active' : ''}`}
                    onClick={() => onTabChange('expenses')}
                >
                    <Upload className="h-5 w-5 mb-1" />
                    Expenses
                </button>
            )}

            {permissions.canReadIncomes && (
                <button
                    className={`nav-button ${activeTab === 'incomes' ? 'active' : ''}`}
                    onClick={() => onTabChange('incomes')}
                >
                    <Download className="h-5 w-5 mb-1" />
                    Income
                </button>
            )}
        </nav>
    );
};
