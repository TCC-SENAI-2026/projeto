function Modal({ aberto, onClose, children, className = "", tituloId }) {
    if (!aberto) return null;

    return (
        <div className={`modal-overlay ${aberto ? `active` : ''}`}
            onClick={onClose}>
            <div 
                className={`cliente-modal ${className}`.trim()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={tituloId}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar janela">
                    <span className="material-icons">close</span>
                </button>
                {children}
            </div>
        </div>
    );
}

export default Modal;
