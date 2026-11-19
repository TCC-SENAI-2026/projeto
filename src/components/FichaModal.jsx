import { useEffect } from "react";
import { createPortal } from "react-dom";
import FichaConteudo from "./FichaConteudo";

// "2026-11-04" -> Date local (new Date("2026-11-04") daria o dia anterior no Brasil)
function lerData(texto) {
    if (!texto) return null;
    const [ano, mes, dia] = String(texto).slice(0, 10).split("-").map(Number);
    if (!ano || !mes || !dia) return null;
    return new Date(ano, mes - 1, dia);
}

// Retorna "atrasado", "urgente" (hoje ou até 2 dias) ou ""
function situacaoPrazo(texto, status) {
    const entrega = lerData(texto);
    if (!entrega || status === "finalizado") return "";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dias = Math.round((entrega - hoje) / 86400000);
    if (dias < 0) return "atrasado";
    if (dias <= 2) return "urgente";
    return "";
}

function FichaModal({
    ficha,
    onFechar,
    onIniciar,
    onFinalizar,
    bloqueado = false,
    mostrarBotaoIniciar = true,
    mostrarBotaoFinalizar = true,
}) {
    const dados = ficha.ficha || {};
    const prazo = situacaoPrazo(dados.entrega, ficha.status);
    const possuiAcaoRodape = (ficha.status === "producao" && mostrarBotaoFinalizar)
        || (ficha.status === "pendente" && mostrarBotaoIniciar);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onFechar();
        document.addEventListener("keydown", onKey);
        document.body.classList.add("imprimindo-modal");

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.classList.remove("imprimindo-modal");
        };
    }, [onFechar]);

    return createPortal(
        <div className="fc-modal-overlay fc-modal-ficha-overlay" onClick={onFechar}>
            <div
                className="fc-modal fc-modal-ficha"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="fc-modal-header">
                    <h2>Ficha Técnica #{ficha.id}</h2>

                    <div className="fc-modal-acoes no-print">
                        <button
                            type="button"
                            className="fc-modal-imprimir"
                            onClick={() => window.print()}
                        >
                            <span className="material-icons">print</span>
                            Imprimir
                        </button>

                        <button
                            type="button"
                            className="fc-modal-fechar"
                            onClick={onFechar}
                            aria-label="Fechar"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                <div className="fc-modal-body">
                    <FichaConteudo pedido={ficha.pedido} ficha={ficha.ficha} situacaoEntrega={prazo} />
                </div>

                {/* Rodapé com ação por status e fechamento móvel. */}
                <div className={`fc-modal-rodape no-print${possuiAcaoRodape ? "" : " fc-modal-rodape-sem-acao"}`}>
                    <button
                        type="button"
                        className="btn-page-sec fc-modal-fechar-rodape"
                        onClick={onFechar}
                    >
                        Fechar
                    </button>

                    {ficha.status === "pendente" && mostrarBotaoIniciar && (
                        <button
                            type="button"
                            className="btn btn-add"
                            disabled={bloqueado}
                            onClick={onIniciar}
                        >
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>
                                play_arrow
                            </span>
                            Iniciar pedido
                        </button>
                    )}

                    {ficha.status === "producao" && mostrarBotaoFinalizar && (
                        <button
                            type="button"
                            className="btn btn-add"
                            disabled={bloqueado}
                            onClick={onFinalizar}
                        >
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>
                                check_circle
                            </span>
                            Finalizar pedido
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default FichaModal;