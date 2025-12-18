import "./MinusButton.css";

export default function MinusButton({onClick}) {
    return (
        <button 
            className="down-triangle-button"
            onClick={onClick}
        >
            <span className="minus">-</span>
        </button>
    );
}
