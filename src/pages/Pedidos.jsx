import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import FichaConteudo from "../components/FichaConteudo";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/novoPedido.css";
import "../styles/pedido.css";

function Pedidos() {
    const [tab, setTab] = useState("recentes");
    const [modalAberto, setModalAberto] = useState(false);
    const [dadosFicha, setDadosFicha] = useState(null);
    const navigate = useNavigate();

    function abrirPedido(id) {
        setDadosFicha({
            ficha: {
                cliente: id === 1023 ? "Empresa X" : "Empresa Y",
                contato: "(14) 99999-9999",
                email: "contato@empresa.com",
                dataPedido: "28/09/2026",
                entrega: "20/10/2026",
                prioridade: "alta",
                observacao: "Cliente pediu urgência na entrega.",
            },
            pedido: {
                arte: null,
                produtos: [
                    {
                        item: "Camiseta Polo",
                        grade: { P: 10, M: 20, G: 15, GG: 5 },
                        fotoUrl: "https://exemplo.com/foto-polo.jpg",
                        detalhes: {
                            tecido: "Piquet",
                            cor: "Azul marinho",
                            personalizacao: "Bordado",
                            local: "Frente — Peito Esquerdo",
                            observacao: "Bordar logo com linha branca de alta densidade.",
                        },
                    },
                ],
            },
        });
        setModalAberto(true);
    }

    function confirmarExclusao(id) {
        const confirmar = window.confirm(`Deseja excluir #${id}?`);
        if (confirmar) {
            alert("Pedido excluído com sucesso");
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
                                Pedidos <span className="page-count">(2)</span>
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
                            <option value="producao">Em produção</option>
                        </select>

                        <button className="btn btn-add" type="button" onClick={() => navigate("/pedidos/novo")}>
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
                            Histórico de Pedidos
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
                                    <span className="mobile-field-label">Ações</span>
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
                                    <span className="mobile-field-label">Ações</span>
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

                <Modal aberto={modalAberto} onClose={() => setModalAberto(false)}>
                    <div className="modal-header">
                        <h2 className="modal-title">Ficha Técnica do Pedido</h2>
                    </div>

                    <div className="ficha-modal-body" style={{ padding: "16px 0" }}>
                        {dadosFicha && (
                            <FichaConteudo pedido={dadosFicha.pedido} ficha={dadosFicha.ficha} />
                        )}
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            className="btn-page-sec" 
                            onClick={() => window.print()} 
                            style={{ marginRight: "auto" }}
                        >
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 4 }}>print</span>
                            Imprimir
                        </button>
                        <button type="button" className="btn-sec" onClick={() => setModalAberto(false)}>
                            Fechar
                        </button>
                    </div>
                </Modal>
            </div>
        </>
    );
}

export default Pedidos;