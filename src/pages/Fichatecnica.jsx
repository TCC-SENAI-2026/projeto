import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/novoPedido.css";
import FichaConteudo from "../components/FichaConteudo";

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

                    <FichaConteudo pedido={pedido} ficha={ficha} />

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