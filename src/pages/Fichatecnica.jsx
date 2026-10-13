import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FichaConteudo from "../components/FichaConteudo";
import { salvarPedido } from "../services/pedidosService";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/Novopedido.css";


// Mapeamento de cores para cada técnica de personalização
const TECNICA_CORES = {
    bordado: { bg: "#fef9c3", color: "#854d0e", label: "Bordado" },
    silk: { bg: "#dcfce7", color: "#166534", label: "Silk Screen" },
    sublimacao: { bg: "#fee2e2", color: "#991b1b", label: "Sublimação" },
    dtf: { bg: "#e0e7ff", color: "#3730a3", label: "DTF" },
    transfer: { bg: "#f3e8ff", color: "#6b21a8", label: "Transfer" },
    default: { bg: "#e5e7eb", color: "#374151", label: "—" },
};

function getTecnicaCor(tecnica) {
    if (!tecnica) return TECNICA_CORES.default;
    const key = tecnica.toLowerCase().replace(/\s/g, "").replace("screen", "");
    return TECNICA_CORES[key] || TECNICA_CORES.default;
}

// Cores de prioridade
const PRIORIDADE_COR = {
    baixa: { bg: "#dcfce7", color: "#166534" },
    media: { bg: "#fef9c3", color: "#854d0e" },
    alta: { bg: "#fee2e2", color: "#991b1b" },
};



function FichaTecnica() {
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [ficha, setFicha] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        const d = localStorage.getItem("detalhesPedido");
        const f = localStorage.getItem("dadosFicha");
        if (d) setPedido(JSON.parse(d));
        if (f) setFicha(JSON.parse(f));
    }, []);

    async function finalizar() {
        if (salvando) return;

        setSalvando(true);
        try {
            // TODO(BACK): POST /api/pedidos (a chamada real está em pedidosService.js → salvarPedido)
            // O back gera id, status inicial ("pendente") e criadoEm, e devolve o pedido criado.

            await salvarPedido({ pedido, ficha });
            setModalAberto(true);
            // Rascunho do formulário: pode continuar no localStorage mesmo com back
            localStorage.removeItem("detalhesPedido");
            localStorage.removeItem("dadosFicha");
        } catch (erro) {
            console.error("Erro ao salvar pedido:", erro);
            alert(erro.message || "Não foi possível salvar o pedido. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    }

    function fecharESair() {
        setModalAberto(false);
        navigate("/pedidos");
    }

    // --- Estado vazio ---
    if (!pedido || !ficha) {
        return (
            <>
                <Sidebar />
                <div className="container">
                    <div className="form-page-card">
                        <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>
                            Nenhum pedido encontrado. Volte e preencha o formulário.
                        </p>
                        <div className="form-actions">
                            <button className="btn btn-add" onClick={() => navigate("/pedidos/novo")}>
                                Voltar ao início
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const prio = PRIORIDADE_COR[ficha.prioridade] || { bg: "#e5e7eb", color: "#374151" };

    // TODO(BACK): a arte vem em base64. Trocar por URL devolvida pelo upload (ver SelecionarProdutos.jsx)
    const arteGeral = pedido.arte || null;

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="form-page-card">

                    {/* CABEÇALHO */}
                    <div className="form-header">
                        <span className="form-badge">
                            <span className="material-icons">fact_check</span>
                            Novo Pedido
                        </span>
                        <h1 className="form-title">Revisar Ficha Técnica</h1>
                        <p className="form-subtitle">
                            Confira todos os dados antes de finalizar o pedido.
                        </p>
                    </div>

                    {/* STEPPER */}
                    <div className="pedido-stepper">
                        <div className="pedido-step completed">
                            <div className="step-circle">✓</div>
                            <span>Identificação</span>
                        </div>
                        <div className="pedido-step-line completed" />
                        <div className="pedido-step completed">
                            <div className="step-circle">✓</div>
                            <span>Produtos</span>
                        </div>
                        <div className="pedido-step-line completed" />
                        <div className="pedido-step active">
                            <div className="step-circle">3</div>
                            <span>Finalização</span>
                        </div>
                    </div>

                    {/* ── BLOCO A: DADOS GERAIS DO PEDIDO ── */}
                    <section className="form-section">
                        <h2>Dados do Pedido</h2>
                        <p className="section-help">Informações gerais registradas na etapa anterior.</p>

                        <div className="ficha-info-grid">
                            <div className="ficha-info-item">
                                <span className="ficha-label">Cliente</span>
                                <span className="ficha-value">{ficha.cliente || "—"}</span>
                            </div>
                            <div className="ficha-info-item">
                                <span className="ficha-label">Contato</span>
                                <span className="ficha-value">{ficha.contato || "—"}</span>
                            </div>
                            <div className="ficha-info-item">
                                <span className="ficha-label">E-mail</span>
                                <span className="ficha-value">{ficha.email || "—"}</span>
                            </div>
                            <div className="ficha-info-item">
                                <span className="ficha-label">Data do Pedido</span>
                                <span className="ficha-value">{ficha.dataPedido || "—"}</span>
                            </div>
                            <div className="ficha-info-item">
                                <span className="ficha-label">Prazo de Entrega</span>
                                <span className="ficha-value">{ficha.entrega || "—"}</span>
                            </div>
                            <div className="ficha-info-item">
                                <span className="ficha-label">Prioridade</span>
                                <span
                                    className="ficha-value"
                                    style={{
                                        display: "inline-block",
                                        padding: "4px 12px",
                                        borderRadius: 999,
                                        background: prio.bg,
                                        color: prio.color,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {ficha.prioridade || "—"}
                                </span>
                            </div>
                            {ficha.local && (
                                <div className="ficha-info-item">
                                    <span className="ficha-label">Local Padrão da Arte</span>
                                    <span className="ficha-value">{ficha.local}</span>
                                </div>
                            )}
                            {ficha.personalizacao && (
                                <div className="ficha-info-item">
                                    <span className="ficha-label">Obs. Personalização</span>
                                    <span className="ficha-value">{ficha.personalizacao}</span>
                                </div>
                            )}
                            {ficha.observacao && (
                                <div className="ficha-info-item ficha-info-full">
                                    <span className="ficha-label">Observações Gerais</span>
                                    <span className="ficha-value">{ficha.observacao}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── BLOCO B: ARTE GERAL (se houver uma só para o pedido inteiro) ── */}
                    {arteGeral && (
                        <section className="form-section">
                            <h2>Arte do Pedido</h2>
                            <p className="section-help">
                                Imagem de referência enviada pelo cliente. Pode ser aplicada em diferentes
                                técnicas conforme cada item abaixo.
                            </p>
                            <img
                                src={arteGeral}
                                alt="Arte do pedido"
                                style={{ maxWidth: 220, borderRadius: 12, border: "1px solid #e2e8f0" }}
                            />
                        </section>
                    )}


                    {/* BLOCO C: FICHAS TÉCNICAS INDUSTRIAIS */}
                    <section className="form-section secao-fichas-industriais">
                        <h2 className="no-print">Fichas Técnicas dos Itens</h2>

                        <p className="section-help no-print">
                            Visualização técnica dos produtos do pedido.
                        </p>

                        <FichaConteudo pedido={pedido} ficha={ficha} />
                    </section>


                    {/* ── AÇÕES ── */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-page-sec"
                            onClick={() => navigate("/pedidos/novo/produtos")}
                        >
                            Voltar
                        </button>

                        {/* Botão imprimir — só aparece na tela, some na impressão via CSS */}
                        <button
                            type="button"
                            className="btn-page-sec no-print"
                            onClick={() => window.print()}
                        >
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>
                                print
                            </span>
                            Imprimir Ficha
                        </button>

                        <button
                            type="button"
                            className="btn btn-add no-print"
                            onClick={finalizar}
                            disabled={salvando}
                        >
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>
                                check_circle
                            </span>
                            {salvando ? "Salvando..." : "Finalizar Pedido"}
                        </button>
                    </div>

                </div>
            </div>

            {/* MODAL DE SUCESSO */}
            {modalAberto && (
                <div className="modal-overlay active">
                    <div className="modal-sucesso">
                        <div className="modal-sucesso-icon">
                            <span className="material-icons">check_circle</span>
                        </div>
                        <h2>Pedido enviado com sucesso!</h2>

                        {/* TODO(BACK): confirmar com o back se o pedido já nasce em produção; hoje nasce "pendente" */}
                        
                        <p>Os itens já estão na fila de produção.</p>
                        <button className="btn btn-add" onClick={fecharESair}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default FichaTecnica;