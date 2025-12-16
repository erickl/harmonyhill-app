import "./PlusButton.css";

export default function PlusButton({onClick}) {
    return (
        <button 
            class="up-triangle-button"
            onClick={onClick}
        >
            <span class="plus">+</span>
        </button>
    );
}
