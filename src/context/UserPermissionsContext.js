import React, { createContext, useState, useEffect, useContext } from "react";
import * as userService from "../services/userService.js";
import { auth } from "../firebase.js";

const UserPermissionsContext = createContext();

export function UserPermissionProvider({ children }) {
    const [permissions, setPermissions] = useState({});
    const [user,        setUser       ] = useState(null);
    const [users,       setUsers      ] = useState([]);
    const [loading,     setLoading    ] = useState(true);

    const toString = () => {
        return JSON.stringify(permissions);
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const [
                        permissions,
                        user_,
                        users_,
                    ] = await Promise.all([
                        userService.getPermissions(),
                        userService.getCurrentUser(),
                        userService.getUsers(),
                    ]);

                    setUsers(users_);
                    
                    setPermissions({
                        isAdmin : permissions.isAdmin === true,
                        isManagerOrAdmin : permissions.isAdmin === true || permissions.isManager === true,
                        
                        canEditBookings : permissions["bookings-u"] === true,
                        canAddBookings : permissions["bookings-c"] === true,
                        canDeleteBookings : permissions["bookings-d"] === true,
                        canReadBookings : permissions["bookings-r"] === true,

                        canEditActivities : permissions["activities-u"] === true,
                        canAddActivities : permissions["activities-c"] === true,
                        canDeleteActivities : permissions["activities-d"] === true,
                        canReadActivities : permissions["activities-r"] === true,
                        
                        canReadExpenses : permissions["expenses-r"] === true,
                        canEditExpenses : permissions["expenses-u"] === true,
                        canDeleteExpenses : permissions["expenses-d"] === true,
                        canAddExpenses : permissions["expenses-c"] === true,

                        canReadIncomes : permissions["incomes-r"] === true,
                        canEditIncomes : permissions["incomes-u"] === true,
                        canDeleteIncomes : permissions["incomes-d"] === true,
                        canAddIncomes : permissions["incomes-c"] === true,
                    });

                    setUser(user_);
                } catch (error) {
                    console.error("Error fetching permissions:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setPermissions({});
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserPermissionsContext.Provider value={{ permissions, user, users, loading, toString }}>
            {children}
        </UserPermissionsContext.Provider>
    );
}

export function useUserPermissions() {
    return useContext(UserPermissionsContext);
}
