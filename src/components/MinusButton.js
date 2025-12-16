import "./MinusButton.css";

export default function MinusButton({onClick}) {
    return (
        <button 
            class="down-triangle-button"
            onClick={onClick}
        >
            <span class="minus">-</span>
        </button>
    );
}
