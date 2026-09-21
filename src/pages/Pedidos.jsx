import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/pedido.css";

function Pedidos() {
    const [tab, setTab] = useState("recentes");
    const navigate = useNavigate();

    function abrirPedido(id) {
        alert("Abrir pedido " + id);
    }

    function confirmarExclusao(id) {
        const confirmar = window.confirm(`Deseja excluir #${id}?`);
        if (confirmar) {
            alert("Pedido excluido com sucesso");
        }
    }

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="top top-compact">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">
                                Pedidos <span className="page-count">(0)</span>
                            </h1>
                        </div>
                    </div>

                    <div className="top-right top-right-inline">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>
                            <input className="search" placeholder="Pesquisar pedido" />
                        </div>

                        <select className="btn btn-filter">
                            <option value="">Todos os pedidos</option>
                            <option value="pendente">Pendentes</option>
                            <option value="finalizado">Finalizados</option>
                            <option value="producao">Em producao</option>
                        </select>

                        <button className="btn btn-add" type="button"
                            onClick={() => navigate("/pedidos/novo")}>
                            + Pedido
                        </button>
                    </div>
                </div>

                <div className="list">
                    <div className="tabs">
                        <button
                            className={`tab-btn ${tab === "recentes" ? "active" : ""}`}
                            onClick={() => setTab("recentes")}
                        >
                            Pedidos Recentes
                        </button>

                        <button
                            className={`tab-btn ${tab === "historico" ? "active" : ""}`}
                            onClick={() => setTab("historico")}
                        >
                            Historico de Pedidos
                        </button>
                    </div>

                    {tab === "recentes" && (
                        <div className="tab-content active">
                            <div className="product pedido-card" onClick={() => abrirPedido(1023)}>
                                <div className="produto">
                                    <div className="img"></div>
                                    <div className="pedido-main">
                                        <span className="mobile-field-label">Pedido</span>
                                        <p>#1023</p>
                                    </div>
                                </div>

                                <div className="empresa info-block">
                                    <span className="mobile-field-label">Empresa</span>
                                    <p>Empresa X</p>
                                </div>

                                <div className="status-col info-block">
                                    <span className="mobile-field-label">Status</span>
                                    <span className="status pendente">Pendente</span>
                                </div>

                                <div className="actions">
                                    <span className="mobile-field-label">Acoes</span>
                                    <button
                                        className="action-btn edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alert("Editar");
                                        }}
                                    >
                                        <span className="material-icons">edit</span>
                                    </button>

                                    <button
                                        className="action-btn delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmarExclusao(1023);
                                        }}
                                    >
                                        <span className="material-icons">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "historico" && (
                        <div className="tab-content active">
                            <div className="product pedido-card" onClick={() => abrirPedido(1024)}>
                                <div className="produto">
                                    <div className="img"></div>
                                    <div className="pedido-main">
                                        <span className="mobile-field-label">Pedido</span>
                                        <p>#1024</p>
                                    </div>
                                </div>

                                <div className="empresa info-block">
                                    <span className="mobile-field-label">Empresa</span>
                                    <p>Empresa Y</p>
                                </div>

                                <div className="status-col info-block">
                                    <span className="mobile-field-label">Status</span>
                                    <span className="status ok">Finalizado</span>
                                </div>

                                <div className="actions">
                                    <span className="mobile-field-label">Acoes</span>
                                    <button
                                        className="action-btn edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alert("Editar");
                                        }}
                                    >
                                        <span className="material-icons">edit</span>
                                    </button>

                                    <button
                                        className="action-btn delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmarExclusao(1024);
                                        }}
                                    >
                                        <span className="material-icons">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Pedidos;
