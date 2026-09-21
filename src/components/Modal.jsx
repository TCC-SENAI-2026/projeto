import { createPortal } from "react-dom";

function Modal({ aberto, onClose, children }) {

    if (!aberto) return null;

    return createPortal(
        <div
            className="modal-overlay active"
            onClick={onClose}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="modal-close"
                    onClick={onClose}
                    type="button"
                >
                    <span className="material-icons">close</span>
                </button>

                {children}

            </div>
        </div>,

        document.body
    );
}

export default Modal;