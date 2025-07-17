import { useMenu } from '../context/MenuContext';

export default function VeganHamburgerButton() {
  const { toggle } = useMenu();

  return (
    <button
      onClick={toggle}
      style={{
        position: 'fixed',     // Key: ignore layout, position relative to viewport
        top: '1.8rem',           // Distance from top
        left: '-2.2rem',          // Distance from left
        zIndex: 1000,          // Stay on top
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