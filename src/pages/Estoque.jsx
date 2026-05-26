import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/estoque.css";

function Estoque() {
    const [tab, setTab] = useState("produtos");
    const navigate = useNavigate();

    function abrirItemEstoque(id) {
        alert("Abrir item: " + id);
    }

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="top top-compact">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">
                                Estoque <span className="page-count">(0)</span>
                            </h1>
                        </div>

                        <p className="page-subtitle">Gerenciamento do estoque de produtos e materiais</p>
                    </div>

                    <div className="top-right top-right-inline">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>
                            <input className="search" placeholder="Pesquisar item" />
                        </div>

                        <select className="btn btn-filter">
                            <option>Todos os itens</option>
                            <option>Baixo estoque</option>
                            <option>Sem estoque</option>
                            <option>Disponivel</option>
                        </select>

                        <button
                            className="btn btn-add"
                            onClick={() => navigate("/add-estoque")}
                        >
                            + Item
                        </button>
                    </div>
                </div>

                <div className="list">
                    <div className="tabs">
                        <button
                            className={`tab-btn ${tab === "produtos" ? "active" : ""}`}
                            onClick={() => setTab("produtos")}
                        >
                            Estoque Produtos
                        </button>

                        <button
                            className={`tab-btn ${tab === "materiais" ? "active" : ""}`}
                            onClick={() => setTab("materiais")}
                        >
                            Estoque Materiais
                        </button>

                        <button
                            className={`tab-btn ${tab === "movimentacoes" ? "active" : ""}`}
                            onClick={() => setTab("movimentacoes")}
                        >
                            Movimentacoes
                        </button>
                    </div>

                    <div className="table-header estoque-header">
                        <span>Item</span>
                        <span>Categoria</span>
                        <span>Quantidade</span>
                        <span>Status</span>
                        <span>Acoes</span>
                    </div>

                    {tab === "produtos" && (
                        <div className="tab-content active">
                            <div
                                className="product estoque-row estoque-card"
                                onClick={() => abrirItemEstoque("camiseta-oversized")}
                            >
                                <div className="item-info">
                                    <div className="img">
                                    </div>
                                    <div className="produto estoque-main">
                                        <span className="mobile-field-label">Item</span>
                                        <p>Camiseta Oversized</p>
                                    </div>
                                </div>

                                <div className="categoria info-block">
                                    <span className="mobile-field-label">Categoria</span>
                                    <p>Vestuario</p>
                                </div>

                                <div className="quantidade info-block">
                                    <span className="mobile-field-label">Quantidade</span>
                                    <p>120</p>
                                </div>

                                <div className="status-col info-block">
                                    <span className="mobile-field-label">Status</span>
                                    <span className="status ok">Disponivel</span>
                                </div>

                                <div className="actions">
                                    <span className="mobile-field-label">Acoes</span>
                                    <button
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alert("Editar");
                                        }}
                                    >
                                        <span className="material-icons">edit</span>
                                    </button>

                                    <button
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alert("Excluir");
                                        }}
                                    >
                                        <span className="material-icons">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "materiais" && (
    <div className="tab-content active">
        <div
            className="product estoque-row estoque-card"
            onClick={() => abrirItemEstoque("tecido-algodao")}
        >
            <div className="item-info">
                <div className="img"></div>

                <div className="produto estoque-main">
                    <span className="mobile-field-label">Item</span>
                    <p>Tecido Algodao</p>
                </div>
            </div>

            <div className="categoria info-block">
                <span className="mobile-field-label">Categoria</span>
                <p>Materia-prima</p>
            </div>

            <div className="quantidade info-block">
                <span className="mobile-field-label">Quantidade</span>
                <p>30m</p>
            </div>

            <div className="status-col info-block">
                <span className="mobile-field-label">Status</span>
                <span className="status baixo">Baixo estoque</span>
            </div>

            <div className="actions">
                <span className="mobile-field-label">Acoes</span>

                <button
                    className="action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        alert("Editar");
                    }}
                >
                    <span className="material-icons">edit</span>
                </button>

                <button
                    className="action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        alert("Excluir");
                    }}
                >
                    <span className="material-icons">delete</span>
                </button>
            </div>
        </div>
    </div>
)}

{tab === "movimentacoes" && (
    <div className="tab-content active">
        <div
            className="product estoque-row estoque-card"
            onClick={() =>
                abrirItemEstoque("movimentacao-camiseta-oversized")
            }
        >
            <div className="item-info">
                <div className="img"></div>

                <div className="produto estoque-main">
                    <span className="mobile-field-label">Item</span>
                    <p>Camiseta Oversized</p>
                </div>
            </div>

            <div className="categoria info-block">
                <span className="mobile-field-label">Movimento</span>
                <p>Saida</p>
            </div>

            <div className="quantidade info-block">
                <span className="mobile-field-label">Quantidade</span>
                <p>10</p>
            </div>

            <div className="status-col info-block">
                <span className="mobile-field-label">Status</span>
                <span className="status saida">Movimentacao</span>
            </div>

            <div className="actions">
                <span className="mobile-field-label">Acoes</span>

                <button
                    className="action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        alert("Ver detalhes");
                    }}
                >
                    <span className="material-icons">visibility</span>
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

export default Estoque;
