import { useEffect, useState } from "react";
import "./NotificationsMenu.css";
import { useMenu } from '../context/MenuContext.js';
import { useToast } from "../context/ToastContext.js";
import { useNotifications } from "../context/NotificationContext.js";
import NotificationForActivity from "./NotificationForActivity.js";
import { XIcon } from 'lucide-react';
import * as utils from "../utils.js";

export default function NotificationsMenu({ }) {

    const { notifications } = useNotifications();
    const { open, close } = useMenu("notificationsMenu");
    const { onError } = useToast();

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
                left: 0,
                transform: open ? 'translateX(0)' : 'translateX(-100%)',
                backgroundColor: '#333',
                color: 'white',
                transition: 'transform 0.3s ease-in-out',
                zIndex: 3000,
                padding: '1rem',
            }}
        >
            <div className="header">
                <XIcon onClick={close} style={{ color: 'white', marginBottom: '1rem' }} />
                <h2 className="menu-title">Notifications</h2>
            </div>

            <div>
                {notifications.map((notification, i) => {
                    if(notification.count < 1) return <></>;
                    return (
                        <div
                            key={`notification-${i}`}
                        >
                            <div className="type">
                                {notification.name}: {notification.count}
                            </div>
                            <div className="timestamp">
                                {utils.to_ddMMM_HHmm(notification.createdAt)}
                            </div>

                            <div>
                                {notification.ids.map((id, j) => {
                                    if(notification.collectionName === "activities") {
                                        return (
                                            <div key={`notification-${i}-item-${j}`}>
                                                <NotificationForActivity 
                                                    id={id}
                                                />
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </>);
}