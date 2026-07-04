import React, { useState, useEffect } from 'react';
import { useMenu } from '../context/MenuContext.js';
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import { useNotification } from "../context/NotificationContext.js";
import * as userService from "../services/userService.js";
import packageJson from '../../package.json';
import { XIcon } from 'lucide-react';
import "./SideMenu.css";

export default function SideMenu({context}) {

    const { open, close } = useMenu();
    const { onError } = useNotification();
    const { permissions, user } = useUserPermissions();

    const logout = async () => {
        const success = await userService.logout();
        if (success) {
            close();
        } else {
            onError("Couldn't logout");
        }
    }

    return (<>
        {open && (
            <div
                onClick={() => close()}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.0)',
                    zIndex: 2999, // just below the menu
                }}
            />
        )}
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",    
                width: "clamp(280px, 20vw, 400px)",
                position: 'fixed',
                top: 0,
                transform: open ? 'translateX(0)' : 'translateX(-100%)',
                backgroundColor: '#333',
                color: 'white',
                transition: 'left 0.3s ease-in-out',
                zIndex: 3000,
                padding: '1rem',
            }}
        >
            <XIcon onClick={close} style={{ color: 'white', marginBottom: '1rem' }} />
            
            <ul className='menu-list'> 
                {permissions.isAdmin && (<>
                    <li><p onClick={() => {
                            context.onNavigate('admin');
                            close();
                        }} 
                        style={{ color: 'white' }}>Admin</p>
                    </li>

                    <li><p onClick={() => {
                            context.onNavigate('inventory');
                            close();
                        }} 
                        style={{ color: 'white' }}>Inventory</p>
                    </li>

                    {true && (<li><p onClick={() => {
                            context.onNavigate('todo-list');
                            close();
                        }} 
                        style={{ color: 'white' }}>Todo</p>
                    </li>)}

                    <li><p onClick={() => {
                            context.onNavigate('userLogs');
                            close();
                        }} 
                        style={{ color: 'white' }}>User Logs</p>
                    </li>
                </>)}
                <li><p onClick={() => logout()} style={{ color: 'white' }}>Logout</p></li>
            </ul>

            <div className="side-menu-footer">
                {user && (<p>User: {user.name}</p>)}
                <p>v{packageJson.version}</p>
            </div>
        </div>
    </>);
}
