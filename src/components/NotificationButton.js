import { useMenu } from '../context/MenuContext.js';
import { Bell } from 'lucide-react';

export default function NotificationButton() {
    const { toggle } = useMenu("notificationsMenu");

    return (
        <Bell
            onClick={toggle}
            style={{
                top: '1.8rem',
                left: '1rem',
                zIndex: 3000,
                background: 'transparent',
                color: 'black',
                border: 'none',
                fontSize: 28,
                cursor: 'pointer',
            }}
        />
    );
}