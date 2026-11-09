import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { estaBaixo, formatarQuantidadeEstoque } from "../utils/estoque";
import { api } from "../services/api.js";

import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";

import "../styles/padrao.css";
import "../styles/Estoque.css";
import "../styles/cliente.css";


function Estoque() {
    const navigate = useNavigate();

    // O filtro vem da URL: /estoque?filtro=baixo
    const [searchParams, setSearchParams] = useSearchParams();
    const filtro = searchParams.get("filtro") || "";

    const [estoque, setEstoque] = useState([]);
    const [pesquisa, setPesquisa] = useState("");
    const [erroApi, setErroApi] = useState("");
    const [itemSelecionado, setItemSelecionado] = useState(null);

    useEffect(() => {
        if (!itemSelecionado) return;
        function fecharComEscape(evento) {
            if (evento.key === "Escape") setItemSelecionado(null);
        }
        window.addEventListener("keydown", fecharComEscape);
        return () => window.removeEventListener("keydown", fecharComEscape);
    }, [itemSelecionado]);

    useEffect(() => {
        carregarEstoque();
    }, []);

    async function carregarEstoque() {
        try {
            const data = await api.get('/listar-estoque', { lista: true });
            setEstoque(Array.isArray(data) ? data : []);
            setErroApi("");
        } catch (erro) {
            setErroApi("Não foi possível carregar o estoque. Verifique a conexão.");
        }
    }

    async function excluirItem(id) {
        const confirmar = window.confirm("Deseja realmente excluir este item?");
        if (!confirmar) return;

        try {
            await api.delete(`/excluir-estoque/${id}`);
            carregarEstoque();
        } catch (erro) {
            alert(erro.message || "Erro ao excluir item.");
        }
    }

    function mudarFiltro(e) {
        const valor = e.target.value;
        setSearchParams(valor ? { filtro: valor } : {});
    }

    const itensFiltrados = estoque.filter((item) => {
        const correspondeFiltro =
            filtro === "produtos" ? item.tipo_item?.toLowerCase() === "produto"
                : filtro === "materiais" ? item.tipo_item?.toLowerCase() === "material"
                    : filtro === "baixo" ? estaBaixo(item)
                        : true; // "Todo o Estoque"

        const correspondePesquisa = (item.nome_item ?? "")
            .toLowerCase()
            .includes(pesquisa.toLowerCase());

        return correspondeFiltro && correspondePesquisa;
    });

    return (
        <>
            <Sidebar />

            <div className="container">

                {/* CABEÇALHO */}
                <div className="top top-compact">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">
                                Estoque
                                <span className="page-count"> ({estoque.length})</span>
                            </h1>
                        </div>

                        <p className="page-subtitle">
                            Gerenciamento do estoque de produtos e materiais
                        </p>
                    </div>

                    <div className="top-right top-right-inline">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>
                            <input
                                className="search"
                                placeholder="Pesquisar item"
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                            />
                        </div>

                        <select
                            className="btn btn-filter"
                            value={filtro}
                            onChange={mudarFiltro}
                        >
                            <option value="">Total em Estoque</option>
                            <option value="produtos">Produtos</option>
                            <option value="materiais">Materiais</option>
                            <option value="baixo">Estoque Baixo</option>
                        </select>

                        <button
                            className="btn btn-add"
                            type="button"
                            onClick={() => navigate("/add-estoque")}
                        >
                            + Item
                        </button>
                    </div>
                </div>

                {erroApi && (
                    <div className="aviso-erro" role="alert" style={{
                        margin: "0 0 16px", padding: "10px 16px",
                        background: "#fef2f2", border: "1px solid #fca5a5",
                        borderRadius: 8, color: "#b91c1c", fontSize: 14,
                    }}>
                        <span className="material-icons" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 6 }}>error_outline</span>
                        {erroApi}
                    </div>
                )}

                {/* ALERTA DE ESTOQUE BAIXO */}
                {(() => {
                    const baixos = estoque.filter(estaBaixo);
                    if (!baixos.length || filtro === "baixo") return null;
                    return (
                        <div
                            className="alerta-estoque-baixo"
                            role="alert"
                            style={{
                                margin: "0 0 16px", padding: "10px 16px",
                                background: "#fffbeb", border: "1px solid #fcd34d",
                                borderRadius: 8, color: "#92400e", fontSize: 14,
                                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                            }}
                            onClick={() => setSearchParams({ filtro: "baixo" })}
                        >
                            <span className="material-icons" style={{ fontSize: 18, color: "#f59e0b" }}>warning</span>
                            <span>
                                <strong>{baixos.length} {baixos.length === 1 ? "item" : "itens"}</strong> com estoque baixo ou esgotado.
                                {" "}<u>Ver agora</u>
                            </span>
                        </div>
                    );
                })()}

                {/* LISTA */}
                <div className="list">

                    {/* CABEÇALHO DA TABELA */}
                    <div className="estoque-header">
                        <span>Item</span>
                        <span>Quantidade</span>
                        <span>Status</span>
                        <span>Ações</span>
                    </div>

                    {/* ITENS */}
                    <div className="tab-content active">
                        {itensFiltrados.length === 0 ? (
                            <p style={{ padding: "30px", textAlign: "center" }}>
                                Nenhum item encontrado.
                            </p>
                        ) : (
                            itensFiltrados.map((item) => {
                                const baixo = estaBaixo(item);

                                return (
                                    <div
                                        className="product estoque-row estoque-card"
                                        key={item.id}
                                        tabIndex={0}
                                        aria-label={`Ver informações de ${item.nome_item}`}
                                        onClick={() => setItemSelecionado(item)}
                                        onKeyDown={(evento) => {
                                            if (evento.target !== evento.currentTarget) return;
                                            if (evento.key === "Enter" || evento.key === " ") {
                                                evento.preventDefault();
                                                setItemSelecionado(item);
                                            }
                                        }}
                                    >
                                        {/* ITEM */}
                                        <div className="item-info">
                                            {item.tipo_item?.toLowerCase() === "produto" && (
                                                item.tem_imagem ? (
                                                    <img
                                                        className="estoque-thumb"
                                                        src={`/api/estoque/${item.id}/imagem?v=${item.id}`}
                                                        alt={item.nome_item}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="img" aria-hidden="true"></div>
                                                )
                                            )}

                                            <div className="produto estoque-main">
                                                <span className="mobile-field-label">Item</span>
                                                <p>{item.nome_item}</p>
                                                <small style={{ color: "#94a3b8" }}>{item.tipo_item}</small>
                                            </div>
                                        </div>

                                        {/* QUANTIDADE */}
                                        <div className="quantidade info-block">
                                            <span className="mobile-field-label">Quantidade</span>
                                            <p>{formatarQuantidadeEstoque(item)}</p>
                                        </div>

                                        {/* STATUS */}
                                        <div className="status-col info-block">
                                            <span className="mobile-field-label">Status</span>

                                            <span className={baixo ? "status baixo" : "status ok"}>
                                                {baixo ? "Baixo estoque" : "Disponível"}
                                            </span>
                                        </div>

                                        {/* AÇÕES */}
                                        <div className="actions" onClick={(evento) => evento.stopPropagation()}>
                                            <span className="mobile-field-label">Ações</span>

                                            <button
                                                className="action-btn"
                                                title="Editar"
                                                onClick={() => navigate(`/editar-estoque/${item.id}`)}
                                            >
                                                <span className="material-icons">edit</span>
                                            </button>

                                            <button
                                                className="action-btn"
                                                title="Excluir"
                                                onClick={() => excluirItem(item.id)}
                                            >
                                                <span className="material-icons">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            <Modal
                aberto={Boolean(itemSelecionado)}
                onClose={() => setItemSelecionado(null)}
                className="cliente-detalhes-modal"
                tituloId="estoque-modal-titulo"
            >
                {itemSelecionado && (
                    <>
                        <div className="modal-header cliente-modal-header">
                            <div className="cliente-modal-identidade">
                                <div className="cliente-modal-logo">
                                    {itemSelecionado.tem_imagem ? (
                                        <img src={`/api/estoque/${itemSelecionado.id}/imagem`} alt={itemSelecionado.nome_item} />
                                    ) : (
                                        <span className="material-icons" aria-hidden="true">
                                            {itemSelecionado.tipo_item === "material" ? "palette" : "checkroom"}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="modal-title" id="estoque-modal-titulo">{itemSelecionado.nome_item}</h2>
                                    <p className="modal-subtitle">Informações do item de estoque</p>
                                </div>
                            </div>
                            <span className={`cliente-status ${estaBaixo(itemSelecionado) ? "inativo" : "ativo"}`}>
                                <span className="status-dot"></span>
                                {estaBaixo(itemSelecionado) ? "Baixo estoque" : "Disponível"}
                            </span>
                        </div>
                        <div className="modal-body cliente-detalhes-body">
                            <section className="cliente-info-section">
                                <h3>Informações do item</h3>
                                <div className="cliente-info-grid">
                            {[
                                ["Fornecedor", itemSelecionado.fornecedor],
                                ["Quantidade", formatarQuantidadeEstoque(itemSelecionado)],
                                ...(!itemSelecionado.tem_variacoes ? [["Estoque mínimo", itemSelecionado.estoque_minimo]] : []),
                                ["Valor unitário", itemSelecionado.valor_unitario == null ? null :
                                    Number(itemSelecionado.valor_unitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })],
                            ].map(([rotulo, valor]) => (
                                <div className="modal-info" key={rotulo}>
                                    <span className="modal-label">{rotulo}</span>
                                    <p className="modal-value">{valor == null || valor === "" ? "Não informado" : valor}</p>
                                </div>
                            ))}
                                </div>
                            </section>
                        {itemSelecionado.tipo_item?.toLowerCase() === "material" && (
                            <section className="cliente-info-section" aria-labelledby="estoque-cores-titulo">
                                <h3 id="estoque-cores-titulo">Cores cadastradas</h3>
                                {itemSelecionado.cores?.length ? (
                                    <div className="cliente-info-grid">
                                        {itemSelecionado.cores.map(cor => (
                                            <div className="modal-info" key={cor.id}>
                                                <span className="modal-label">{cor.nome_cor}</span>
                                                <p className="modal-value">
                                                    {Number(cor.quantidade_atual).toLocaleString("pt-BR")} metros
                                                </p>
                                                <p className="modal-subtitle">
                                                    Mínimo: {Number(cor.estoque_minimo).toLocaleString("pt-BR")} metros
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p>Nenhuma cor cadastrada.</p>}
                            </section>
                        )}
                            {itemSelecionado.observacoes && (
                                <section className="cliente-info-section">
                                    <h3>Observações</h3>
                                    <p className="cliente-observacoes">{itemSelecionado.observacoes}</p>
                                </section>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
}

export default Estoque;
