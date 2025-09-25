import "./ErrorNoticeModal.css";

export default function ErrorNoticeModal({error, onClose}) {
    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-box">
                <h2>Something happened...</h2>
                <p>{error}</p>
            </div>
        </div>
    );
}
