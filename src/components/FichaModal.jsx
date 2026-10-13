import { useEffect } from "react";
import FichaConteudo from "./FichaConteudo";

function FichaModal({ ficha, onFechar }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onFechar();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onFechar]);

    return (
        <div className="fc-modal-overlay" onClick={onFechar}>
            <div
                className="fc-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="fc-modal-header">
                    <h2>Ficha Técnica #{ficha.id}</h2>
                    <button
                        type="button"
                        className="fc-modal-fechar"
                        onClick={onFechar}
                        aria-label="Fechar"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="fc-modal-body">
                    <FichaConteudo pedido={ficha.pedido} ficha={ficha.ficha} />
                </div>
            </div>
        </div>
    );
}

export default FichaModal;