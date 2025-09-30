import React, { useState, useEffect, use } from 'react';
import { useMenu } from '../context/MenuContext';
import * as userService from "../services/userService.js";
import { useNotification } from "../context/NotificationContext.js";
import packageJson from '../../package.json';
import * as utils from "../utils.js";
import "./SideMenu.css";

export default function SideMenu() {
    const [user, setUser] = useState(null);

    const { open, close } = useMenu();

    const { onError } = useNotification();

    const logout = async () => {
        const success = await userService.logout();
        if (success) {
            close();
        } else {
            onError("Couldn't logout");
        }
    }

    useEffect(() => {
        const getUser = async() => {
            const thisUser = await userService.getCurrentUserName();
            setUser(thisUser);
        }
        getUser();
    }, []);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",    
                width: "20vw",         
                position: 'fixed',
                top: 0,
                transform: open ? 'translateX(0)' : 'translateX(-100%)',
                height: '100%',
                backgroundColor: '#333',
                color: 'white',
                transition: 'left 0.3s ease-in-out',
                zIndex: 3000,
                padding: '1rem',
            }}
        >
            <button onClick={close} style={{ color: 'white', marginBottom: '1rem' }}>Close</button>
            <ul>
                
                <li><a href="/" style={{ color: 'white' }}>Home</a></li>
                <li><a onClick={() => logout()} style={{ color: 'white' }}>Logout</a></li>
            </ul>

            <div className="side-menu-footer">
                <p>User: {user}</p>
                <p>v{packageJson.version}</p>
            </div>
        </div>
    );
}
