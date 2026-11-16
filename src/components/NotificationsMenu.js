import "./NotificationsMenu.css";
import { useMenu } from '../context/MenuContext.js';
import { XIcon } from 'lucide-react';

export default function NotificationsMenu({}) {
    const {open, close} = useMenu("notificationsMenu");

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
            <XIcon onClick={close} style={{ color: 'white', marginBottom: '1rem' }} />

            <div>
                Hello
            </div>
        </div>
    </>);
}