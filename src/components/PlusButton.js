import "./PlusButton.css";

export default function PlusButton({onClick}) {
    return (
        <button 
            className="up-triangle-button"
            onClick={onClick}
        >
            <span className="plus">+</span>
        </button>
    );
}
