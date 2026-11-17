import { useAuth } from '../auth/useAuth';
import SolicitarInativacao from '../components/SolicitarInativacao';
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { estaBaixo, filtrarEstoque, formatarQuantidadeEstoque } from "../utils/estoque";
import { api } from "../services/api.js";

import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";

import "../styles/padrao.css";
import "../styles/estoque.css";
import "../styles/cliente.css";


function Estoque() {
    const { colaborador } = useAuth();
    const administrador = colaborador?.nivel_acesso === 'administrador';
    const navigate = useNavigate();
    const [exclusao, setExclusao] = useState(null);

    // O filtro vem da URL: /estoque?filtro=baixo
    const [searchParams, setSearchParams] = useSearchParams();
    const filtro = searchParams.get("filtro") || "";
    const inativos = filtro === 'inativos';

    const [estoque, setEstoque] = useState([]);
    const [pesquisa, setPesquisa] = useState("");
    const pesquisando = pesquisa.trim().length > 0;
    const statusConsulta = pesquisando ? 'todos' : inativos ? 'inativos' : 'ativos';
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

    const carregarEstoque = useCallback(async (signal) => {
        try {
            const data = await api.get(`/listar-estoque?status=${statusConsulta}`, { lista: true, signal });
            if (signal?.aborted) return;
            setEstoque(Array.isArray(data) ? data : []);
            setErroApi("");
        } catch {
            if (signal?.aborted) return;
            setErroApi("Não foi possível carregar o estoque. Verifique a conexão.");
        }
    }, [statusConsulta]);

    useEffect(() => {
        const controller = new AbortController();
        void Promise.resolve().then(() => carregarEstoque(controller.signal));
        return () => controller.abort();
    }, [carregarEstoque]);


    function mudarFiltro(e) {
        setItemSelecionado(null);
        const valor = e.target.value;
        setSearchParams(valor ? { filtro: valor } : {});
    }

    const itensFiltrados = filtrarEstoque(estoque, filtro, pesquisa);

    return (
        <>
            <Sidebar />
            {exclusao && <SolicitarInativacao alvo="estoque" id={exclusao.id} nome={exclusao.nome_item} reativar={!exclusao.ativo} onConcluido={() => carregarEstoque()} onClose={() => setExclusao(null)} />}

            <div className="container estoque-pagina">

                {/* CABEÇALHO */}
                <div className="top top-compact">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">
                                Estoque
                                <span className="page-count"> ({itensFiltrados.length})</span>
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
                            <option value="inativos">Inativos</option>
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
                    if (!baixos.length || filtro === "baixo" || inativos) return null;
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

                                            {item.tipo_item?.toLowerCase() !== "produto" && (
                                                <div className="img estoque-material-icone" aria-hidden="true">
                                                    <span className="material-icons">palette</span>
                                                </div>
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

                                            <span className={!item.ativo || baixo ? "status baixo" : "status ok"}>
                                                {!item.ativo ? "Inativo" : baixo ? "Baixo estoque" : "Disponível"}
                                            </span>
                                        </div>

                                        {/* AÇÕES */}
                                        <div className="actions" onClick={(evento) => evento.stopPropagation()}>
                                            <span className="mobile-field-label">Ações</span>

                                            {Boolean(item.ativo) && <button
                                                className="action-btn"
                                                title="Editar"
                                                onClick={() => navigate(`/editar-estoque/${item.id}`)}
                                            >
                                                <span className="material-icons">edit</span>
                                            </button>}

                                            <button
                                                className="action-btn"
                                                title={item.ativo ? "Excluir" : "Solicitar reativação"}
                                                aria-label={item.ativo ? "Excluir item" : "Solicitar reativação do item"}
                                                onClick={() => setExclusao(item)}
                                            >
                                                <span className="material-icons">{item.ativo ? 'delete' : 'restore'}</span>
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
                            <span className={`cliente-status ${!itemSelecionado.ativo || estaBaixo(itemSelecionado) ? "inativo" : "ativo"}`}>
                                <span className="status-dot"></span>
                                {!itemSelecionado.ativo ? "Inativo" : estaBaixo(itemSelecionado) ? "Baixo estoque" : "Disponível"}
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
                        <div className="modal-actions">
                            <button type="button" className="btn-sec cliente-acao-editar" onClick={() => {
                                setExclusao(itemSelecionado);
                                setItemSelecionado(null);
                            }}>{itemSelecionado.ativo ? (administrador ? 'Excluir item' : 'Solicitar exclusão') : (administrador ? 'Reativar' : 'Solicitar reativação')}</button>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
}

export default Estoque;
