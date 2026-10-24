import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FichaConteudo from "../components/FichaConteudo";
import { salvarPedido } from "../services/pedidosService";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/Novopedido.css";


function FichaTecnica() {
    const navigate = useNavigate();
    const location = useLocation();
    const [pedido, setPedido] = useState(null);
    const [ficha, setFicha] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [pedidoCriado, setPedidoCriado] = useState(null);

    // File objects vindos de SelecionarProdutos via router state
    // (nunca null, mas pode estar vazio se o usuário acessar a página diretamente)
    const [previewArtes] = useState(() => {
        const artes = location.state?.artesOrdenadas || [];
        return artes.map(f => (f instanceof File ? URL.createObjectURL(f) : null));
    });

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
            const artesOrdenadas = location.state?.artesOrdenadas || [];
            const resultado = await salvarPedido({ pedido, ficha, artesOrdenadas });
            setPedidoCriado(resultado);
            setModalAberto(true);
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

    // previewArtes: array de object URLs geradas no useState inicial (uma por produto, ou null)

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

                    {/* FICHA TÉCNICA ÚNICA */}
                    <section className="form-section secao-fichas-industriais">
                        <h2 className="no-print">Ficha Técnica</h2>

                        <p className="section-help no-print">
                            Visualização técnica dos produtos do pedido.
                        </p>

                        <FichaConteudo pedido={pedido} ficha={ficha} previewArtes={previewArtes} />
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
                        <h2>Pedido #{pedidoCriado?.numero_pedido} enviado!</h2>
                        <p>Os itens já estão na fila de produção.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                            <button className="btn-page-sec" onClick={fecharESair}>
                                Ir para Pedidos
                            </button>
                            <button
                                className="btn btn-add"
                                onClick={() => navigate(`/pedidos/${pedidoCriado?.id}`)}
                            >
                                Ver Ficha Técnica
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default FichaTecnica;