import React, { createContext, useState, useEffect, useContext } from "react";
import * as userService from "../services/userService.js";
import { auth } from "../firebase.js";

const UserPermissionsContext = createContext();

export function UserPermissionProvider({ children }) {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const isAdmin = await userService.isAdmin();
                    const isManagerOrAdmin = await userService.isManagerOrAdmin();
                    
                    setPermissions({
                        isAdmin : isAdmin,
                        isManagerOrAdmin : isManagerOrAdmin,
                    });
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
        <UserPermissionsContext.Provider value={{ permissions, loading }}>
            {children}
        </UserPermissionsContext.Provider>
    );
}

export function useUserPermissions() {
    return useContext(UserPermissionsContext);
}
