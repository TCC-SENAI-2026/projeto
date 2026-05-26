function Modal({ aberto, onClose, children }) {
    if (!aberto) return null;

    return (
        <div className={`modal-overlay ${aberto ? `active` : ''}`}
            onClick={onClose}>
            <div 
                className="cliente-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close" onClick={onClose}>
                    <span className="material-icons">close</span>
                </button>
                {children}
            </div>
        </div>
    );
}

export default Modal;