import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "../context/ToastContext.js";
import * as notificationService from "../services/notificationService.js";

const NotificationsContext = createContext();

export function NotificationsProvider({children}) {
    const [notifications, setNotifications] = useState([]);
    const [count, setCount] = useState(0);
    const { onError } = useToast();

    useEffect(() => {
        (async () => {
            const notifications_ = await notificationService.get({}, onError);
            setNotifications(notifications_);

            const count_ = notifications_.reduce((sum, notification) => sum + notification.count, 0);
            setCount(count_);
        })();
    }, []);

    return (
        <NotificationsContext.Provider value={{ notifications, count }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationsContext);
}