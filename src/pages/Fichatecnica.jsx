import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/novoPedido.css";

// Mapeamento de cores para cada técnica de personalização
const TECNICA_CORES = {
    bordado:      { bg: "#fef9c3", color: "#854d0e", label: "Bordado" },
    silk:         { bg: "#dcfce7", color: "#166534", label: "Silk Screen" },
    sublimacao:   { bg: "#fee2e2", color: "#991b1b", label: "Sublimação" },
    dtf:          { bg: "#e0e7ff", color: "#3730a3", label: "DTF" },
    transfer:     { bg: "#f3e8ff", color: "#6b21a8", label: "Transfer" },
    default:      { bg: "#e5e7eb", color: "#374151", label: "—" },
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
    alta:  { bg: "#fee2e2", color: "#991b1b" },
};

// Formata a grade: soma os tamanhos e retorna { grade, total }
function processarGrade(grade = {}) {
    const total = Object.values(grade).reduce((acc, v) => acc + (Number(v) || 0), 0);
    return { grade, total };
}

function FichaTecnica() {
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [ficha, setFicha] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {
        const d = localStorage.getItem("detalhesPedido");
        const f = localStorage.getItem("dadosFicha");
        if (d) setPedido(JSON.parse(d));
        if (f) setFicha(JSON.parse(f));
    }, []);

    function finalizar() {
        setModalAberto(true);
        localStorage.removeItem("detalhesPedido");
        localStorage.removeItem("dadosFicha");
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

    // Arte geral (enviada na etapa de produtos)
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

                    {/* ── BLOCO C: UM CARD POR ITEM DO PEDIDO ── */}
                    <section className="form-section">
                        <h2>Itens do Pedido</h2>
                        <p className="section-help">
                            Cada item possui sua própria grade de tamanhos, técnica e local de personalização.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
                            {pedido.produtos.map((produto, idx) => {
                                const { grade, total } = processarGrade(produto.grade);
                                const tecCor = getTecnicaCor(produto.detalhes?.personalizacao);

                                // Arte específica do item (se cada item tiver sua própria arte)
                                // Caso não tenha arte por item, usa a arteGeral
                                const arteItem = produto.arte || arteGeral || null;

                                // QR Code: usa a foto do item cadastrada no estoque, ou a arteItem como fallback
                                // const qrValue = produto.fotoUrl || arteItem || null;  -- codigo do CLAUDE
                                // !!codigo abaixo correcao do CHATGPT!!!
                                const qrValue = produto.fotoUrl &&
                                    !produto.fotoUrl.startsWith("data:")
                                    ? produto.fotoUrl
                                    : null;

                                return (
                                    <div key={idx} className="ficha-item-card">

                                        {/* Cabeçalho do card */}
                                        <div className="ficha-item-header">
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <span
                                                    className="material-icons"
                                                    style={{ fontSize: 20, color: "#2563eb" }}
                                                >
                                                    checkroom
                                                </span>
                                                <span className="ficha-item-nome">
                                                    Item #{idx + 1} — {produto.item}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {produto.detalhes?.tecido && (
                                                    <span className="tag-detalhe">
                                                        {produto.detalhes.tecido}
                                                    </span>
                                                )}
                                                {produto.detalhes?.cor && (
                                                    <span className="tag-detalhe" style={{ background: "#f0fdf4", color: "#166534" }}>
                                                        {produto.detalhes.cor}
                                                    </span>
                                                )}
                                                {produto.detalhes?.personalizacao && (
                                                    <span
                                                        className="tag-detalhe"
                                                        style={{
                                                            background: tecCor.bg,
                                                            color: tecCor.color,
                                                        }}
                                                    >
                                                        {produto.detalhes.personalizacao}
                                                    </span>
                                                )}
                                                {produto.detalhes?.local && (
                                                    <span className="tag-detalhe" style={{ background: "#f3e8ff", color: "#6b21a8" }}>
                                                        {produto.detalhes.local}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Corpo: grade + arte/QR */}
                                        <div className="ficha-item-body">

                                            {/* Grade de tamanhos */}
                                            <div style={{ flex: 1 }}>
                                                <div className="ficha-tabela-wrapper">
                                                    <table className="ficha-tabela">
                                                        <thead>
                                                            <tr>
                                                                {Object.keys(grade).map((tam) => (
                                                                    <th key={tam}>{tam}</th>
                                                                ))}
                                                                <th
                                                                    style={{
                                                                        background: "#e0e7ff",
                                                                        color: "#3730a3",
                                                                    }}
                                                                >
                                                                    Total
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                {Object.values(grade).map((qtd, i) => (
                                                                    <td key={i}>{qtd || 0}</td>
                                                                ))}
                                                                <td
                                                                    style={{
                                                                        fontWeight: 700,
                                                                        color: "#1e40af",
                                                                        background: "#eff6ff",
                                                                    }}
                                                                >
                                                                    {total}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Observações do item */}
                                                {produto.detalhes?.observacao && (
                                                    <div
                                                        style={{
                                                            marginTop: 10,
                                                            padding: "10px 14px",
                                                            background: "#f8fafc",
                                                            borderRadius: 10,
                                                            border: "1px solid #e2e8f0",
                                                            fontSize: 13,
                                                            color: "#475569",
                                                        }}
                                                    >
                                                        <strong style={{ color: "#0f172a" }}>Obs.:</strong>{" "}
                                                        {produto.detalhes.observacao}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Coluna direita: Arte + QR */}
                                            <div className="ficha-item-lateral">

                                                {/* Arte do item */}
                                                {arteItem ? (
                                                    <div style={{ textAlign: "center" }}>
                                                        <p className="ficha-label" style={{ marginBottom: 6 }}>Arte</p>
                                                        <img
                                                            src={arteItem}
                                                            alt="Arte do item"
                                                            style={{
                                                                width: 80,
                                                                height: 80,
                                                                objectFit: "contain",
                                                                borderRadius: 8,
                                                                border: "1px solid #e2e8f0",
                                                                background: "#f8fafc",
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="ficha-arte-vazia">
                                                        <span className="material-icons">image_not_supported</span>
                                                        <span>Sem arte</span>
                                                    </div>
                                                )}

                                                {/* QR Code → foto da peça no estoque */}
                                                {qrValue ? (
                                                    <div style={{ textAlign: "center" }}>
                                                        <p className="ficha-label" style={{ marginBottom: 6 }}>
                                                            QR — foto da peça
                                                        </p>
                                                        {/* CODIGO DO CLAUDE !!
                                                         <QRCodeSVG
                                                            value={qrValue}
                                                            size={72}
                                                            bgColor="#ffffff"
                                                            fgColor="#0f172a"
                                                            level="M"
                                                        /> */}
                                                        <QRCodeSVG
                                                            value={qrValue}
                                                            size={72}
                                                            bgColor="#ffffff"
                                                            fgColor="#0f172a"
                                                            level="M"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="ficha-arte-vazia">
                                                        <span className="material-icons">qr_code</span>
                                                        <span>QrCode indisponível</span>
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                        >
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>
                                check_circle
                            </span>
                            Finalizar Pedido
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