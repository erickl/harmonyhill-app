import React, { useState, useEffect, use } from 'react';
import { useMenu } from '../context/MenuContext';
import * as userService from "../services/userService.js";
import ErrorNoticeModal from "./ErrorNoticeModal.js";
import packageJson from '../../package.json';
import * as utils from "../utils.js";
import "./SideMenu.css";

export default function SideMenu() {
    const [user, setUser] = useState(null);

    const { open, close } = useMenu();

    const [errorMessage, setErrorMessage] = useState(null);

    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

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
                height: "100vh",         /* full height */
                width: "40vw",         /* or whatever your sidebar width is */
                position: 'fixed',
                top: 0,
                left: open ? 0 : '-500px',
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

            {errorMessage && (
                <ErrorNoticeModal
                    error={errorMessage}
                    onClose={() => setErrorMessage(null)}
                />
            )}
        </div>
    );
}
