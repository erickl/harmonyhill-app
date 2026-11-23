import { useMenu } from '../context/MenuContext.js';
import { useNotifications } from "../context/NotificationContext.js";
import "./NotificationButton.css";
import { Bell } from 'lucide-react';

export default function NotificationButton() {
    const { toggle } = useMenu("notificationsMenu");
    const { count } = useNotifications();

    return (
        <div className="button">
            <Bell
                onClick={toggle}
                className='bell'
            />
            {count > 0 && (
                <p className="count">{count}</p>
            )}
        </div>
    );
}