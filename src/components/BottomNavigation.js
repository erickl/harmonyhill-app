
import React, { useState, useEffect } from 'react';
import * as userService from "../services/userService.js";
import { Users, List, Upload, Download } from 'lucide-react';
import '../App.css';

export default function BottomNavigation({ activeTab, onTabChange }) {

    const [isAdminOrManager, setIsAdminOrManager] = useState(false);

    useEffect(() => {
        const loadPermissions = async() => {
            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsAdminOrManager(userIsAdminOrManager);
        };

        loadPermissions();
    });

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
            {isAdminOrManager && (
                <>
                    <button
                        className={`nav-button ${activeTab === 'expenses' ? 'active' : ''}`}
                        onClick={() => onTabChange('expenses')}
                    >
                        <Upload className="h-5 w-5 mb-1" />
                        Expenses
                    </button>
                    <button
                        className={`nav-button ${activeTab === 'income' ? 'active' : ''}`}
                        onClick={() => onTabChange('income')}
                    >
                        <Download className="h-5 w-5 mb-1" />
                        Income
                    </button>
                </>
            )}
        </nav>
    );
};
