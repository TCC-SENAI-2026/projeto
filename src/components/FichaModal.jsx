import { useEffect } from "react";
import { createPortal } from "react-dom";
import FichaConteudo from "./FichaConteudo";
import { infoStatus } from "../utils/status";
import { infoPrioridade } from "../utils/prioridade";

// "2026-11-04" -> Date local (new Date("2026-11-04") daria o dia anterior no Brasil)
function lerData(texto) {
    if (!texto) return null;
    const [ano, mes, dia] = String(texto).slice(0, 10).split("-").map(Number);
    if (!ano || !mes || !dia) return null;
    return new Date(ano, mes - 1, dia);
}

function formatarData(texto) {
    const d = lerData(texto);
    return d ? d.toLocaleDateString("pt-BR") : "—";
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

function FichaModal({ ficha, onFechar, onIniciar, onFinalizar, bloqueado = false }) {
    const st = infoStatus(ficha);
    const prio = infoPrioridade(ficha);
    const dados = ficha.ficha || {};
    const prazo = situacaoPrazo(dados.entrega, ficha.status);

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
        <div className="fc-modal-overlay" onClick={onFechar}>
            <div
                className="fc-modal"
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
                    {/* RESUMO DO PEDIDO */}
                    <div className="fc-resumo">
                        <div>
                            <strong>Cliente</strong>
                            <span>{dados.cliente || "—"}</span>
                        </div>
                        <div>
                            <strong>Contato</strong>
                            <span>{dados.contato || "—"}</span>
                        </div>
                        <div>
                            <strong>E-mail</strong>
                            <span>{dados.email || "—"}</span>
                        </div>
                        <div>
                            <strong>Pedido em</strong>
                            <span>{formatarData(dados.dataPedido)}</span>
                        </div>
                        <div>
                            <strong>Entrega</strong>
                            <span className={`fc-prazo ${prazo}`}>
                                {formatarData(dados.entrega)}
                                {prazo === "atrasado" && " (atrasado)"}
                                {prazo === "urgente" && " (urgente)"}
                            </span>
                        </div>

                        {dados.observacao && (
                            <div className="fc-resumo-obs">
                                <strong>Observações gerais</strong>
                                <span>{dados.observacao}</span>
                            </div>
                        )}
                    </div>

                    <FichaConteudo pedido={ficha.pedido} ficha={ficha.ficha} />
                </div>

                {/* RODAPÉ: ação conforme o status. Não sai na impressão. */}
                {(ficha.status === "pendente" || ficha.status === "producao") && (
                    <div className="fc-modal-rodape no-print">
                        <button type="button" className="btn-page-sec" onClick={onFechar}>
                            Fechar
                        </button>

                        {ficha.status === "pendente" && (
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

                        {ficha.status === "producao" && (
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
                )}
            </div>
        </div>,
        document.body
    );
}

export default FichaModal;