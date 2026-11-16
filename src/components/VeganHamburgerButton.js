import { useMenu } from '../context/MenuContext.js';

export default function VeganHamburgerButton() {
    const { toggle } = useMenu("sideMenu");

    return (
        <button
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
        >
            ☰
        </button>
    );
}