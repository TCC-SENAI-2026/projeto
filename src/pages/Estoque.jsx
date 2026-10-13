import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { estaBaixo } from "../utils/estoque";
import axios from "axios";


import Sidebar from "../components/Sidebar";

import "../styles/padrao.css";
import "../styles/Estoque.css";


function Estoque() {
    const navigate = useNavigate();

    // O filtro vem da URL: /estoque?filtro=baixo
    const [searchParams, setSearchParams] = useSearchParams();
    const filtro = searchParams.get("filtro") || "";

    const [estoque, setEstoque] = useState([]);
    const [pesquisa, setPesquisa] = useState("");

    useEffect(() => {
        carregarEstoque();
    }, []);

    async function carregarEstoque() {
        try {
            const resposta = await axios.get("http://localhost:5000/listar-estoque");
            setEstoque(resposta.data);
        } catch (erro) {
            // TODO(BACK): se a API falhar, a tela só mostra "Nenhum item encontrado".
            // Considerar exibir uma mensagem de erro ao usuário.
            console.log("Erro ao carregar estoque:", erro);
        }
    }

    async function excluirItem(id) {
        const confirmar = window.confirm("Deseja realmente excluir este item?");
        if (!confirmar) return;

        try {
            await axios.delete(`http://localhost:5000/excluir-estoque/${id}`);
            alert("Item excluído com sucesso!");
            carregarEstoque();
        } catch (erro) {
            console.log("Erro:", erro);
            alert("Erro ao excluir item.");
        }
    }

    function mudarFiltro(e) {
        const valor = e.target.value;
        setSearchParams(valor ? { filtro: valor } : {});
    }

    const itensFiltrados = estoque.filter((item) => {
        const correspondeFiltro =
            filtro === "produtos" ? item.tipo_item === "Produto"
                : filtro === "materiais" ? item.tipo_item === "Material"
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

                {/* LISTA */}
                <div className="list">

                    {/* CABEÇALHO DA TABELA */}
                    <div className="estoque-header">
                        <span>Item</span>
                        <span>Categoria</span>
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
                                    >
                                        {/* ITEM */}
                                        <div className="item-info">
                                            <div className="img"></div>

                                            <div className="produto estoque-main">
                                                <span className="mobile-field-label">Item</span>
                                                <p>{item.nome_item}</p>
                                            </div>
                                        </div>

                                        {/* CATEGORIA (com o tipo embaixo, para diferenciar em "Todo o Estoque") */}
                                        <div className="categoria info-block">
                                            <span className="mobile-field-label">Categoria</span>
                                            <p>{item.categoria}</p>
                                            <small style={{ color: "#94a3b8" }}>
                                                {item.tipo_item}
                                            </small>
                                        </div>

                                        {/* QUANTIDADE */}
                                        <div className="quantidade info-block">
                                            <span className="mobile-field-label">Quantidade</span>
                                            <p>{item.quantidade_atual}</p>
                                        </div>

                                        {/* STATUS */}
                                        <div className="status-col info-block">
                                            <span className="mobile-field-label">Status</span>

                                            <span className={baixo ? "status baixo" : "status ok"}>
                                                {baixo ? "Baixo estoque" : "Disponível"}
                                            </span>
                                        </div>

                                        {/* AÇÕES */}
                                        <div className="actions">
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
        </>
    );
}

export default Estoque;