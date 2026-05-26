import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/novoPedido.css";

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

    const prioridadeCor = {
        baixa: { bg: "#dcfce7", color: "#166534" },
        media: { bg: "#fef9c3", color: "#854d0e" },
        alta:  { bg: "#fee2e2", color: "#991b1b" },
    };
    const prio = prioridadeCor[ficha.prioridade] || { bg: "#e5e7eb", color: "#374151" };

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="form-page-card">

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

                    {/* DADOS DO CLIENTE */}
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

                            <div className="ficha-info-item">
                                <span className="ficha-label">Local da Personalização</span>
                                <span className="ficha-value">{ficha.local || "—"}</span>
                            </div>

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

                    {/* PRODUTOS */}
                    {pedido.produtos.map((produto, idx) => (
                        <section className="form-section" key={idx}>
                            <h2>Item #{idx + 1} — {produto.item}</h2>
                            <p className="section-help">
                                {produto.detalhes.cor && <span className="tag-detalhe">{produto.detalhes.cor}</span>}
                                {produto.detalhes.tecido && <span className="tag-detalhe">{produto.detalhes.tecido}</span>}
                                {produto.detalhes.personalizacao && <span className="tag-detalhe">{produto.detalhes.personalizacao}</span>}
                            </p>

                            <div className="ficha-tabela-wrapper">
                                <table className="ficha-tabela">
                                    <thead>
                                        <tr>
                                            <th>Tamanho</th>
                                            <th>Quantidade</th>
                                            <th>Tecido</th>
                                            <th>Personalização</th>
                                            <th>Cor</th>
                                            <th>Local da Arte</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(produto.grade).map(([tam, qtd]) => (
                                            <tr key={tam}>
                                                <td>{tam}</td>
                                                <td>{qtd}</td>
                                                <td>{produto.detalhes.tecido || "—"}</td>
                                                <td>{produto.detalhes.personalizacao || "—"}</td>
                                                <td>{produto.detalhes.cor || "—"}</td>
                                                <td>{ficha.local || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}

                    {/* ARTE */}
                    {pedido.arte && (
                        <section className="form-section">
                            <h2>Arte Enviada</h2>
                            <p className="section-help">Imagem de referência para personalização.</p>
                            <img
                                src={pedido.arte}
                                alt="Arte do pedido"
                                style={{ maxWidth: 240, borderRadius: 12, border: "1px solid #e2e8f0" }}
                            />
                        </section>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-page-sec"
                            onClick={() => navigate("/pedidos/novo/produtos")}
                        >
                            Voltar
                        </button>
                        <button
                            type="button"
                            className="btn btn-add"
                            onClick={finalizar}
                        >
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>check_circle</span>
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
