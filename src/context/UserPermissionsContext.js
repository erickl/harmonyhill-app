import React, { createContext, useState, useEffect, useContext } from "react";
import * as userService from "../services/userService.js";
import { auth } from "../firebase.js";

const UserPermissionsContext = createContext();

export function UserPermissionProvider({ children }) {
    const [permissions, setPermissions] = useState({});
    const [user,        setUser       ] = useState(null);
    const [users,       setUsers      ] = useState([]);
    const [loading,     setLoading    ] = useState(true);

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
        <UserPermissionsContext.Provider value={{ permissions, user, users, loading }}>
            {children}
        </UserPermissionsContext.Provider>
    );
}

export function useUserPermissions() {
    return useContext(UserPermissionsContext);
}
