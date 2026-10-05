import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";

import "../styles/padrao.css";
import "../styles/Estoque.css";


function Estoque() {

    const navigate = useNavigate();

    const [tab, setTab] = useState("produtos");

    const [estoque, setEstoque] = useState([]);

    const [pesquisa, setPesquisa] = useState("");


    useEffect(() => {

        carregarEstoque();

    }, []);


    async function carregarEstoque() {

        try {

            const resposta = await axios.get(
                "http://localhost:5000/listar-estoque"
            );

            setEstoque(resposta.data);

        } catch (erro) {

            console.log("Erro ao carregar estoque:", erro);

        }
    }


    async function excluirItem(id) {

        const confirmar = window.confirm(
            "Deseja realmente excluir este item?"
        );

        if (!confirmar) {
            return;
        }


        try {

            await axios.delete(
                `http://localhost:5000/excluir-estoque/${id}`
            );

            alert("Item excluído com sucesso!");

            carregarEstoque();

        } catch (erro) {

            console.log("Erro:", erro);

            alert("Erro ao excluir item.");

        }
    }


    const itensFiltrados = estoque.filter((item) => {

        const correspondeTipo =
            tab === "produtos"
                ? item.tipo_item === "Produto"
                : item.tipo_item === "Material";


        const correspondePesquisa =
            item.nome_item
                ?.toLowerCase()
                .includes(pesquisa.toLowerCase());


        return correspondeTipo && correspondePesquisa;
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

                                <span className="page-count">
                                    {" "}({estoque.length})
                                </span>

                            </h1>

                        </div>


                        <p className="page-subtitle">
                            Gerenciamento do estoque de produtos e materiais
                        </p>

                    </div>


                    <div className="top-right top-right-inline">

                        <div className="search-box">

                            <span className="material-icons search-icon">
                                search
                            </span>

                            <input
                                className="search"
                                placeholder="Pesquisar item"
                                value={pesquisa}
                                onChange={(e) =>
                                    setPesquisa(e.target.value)
                                }
                            />

                        </div>


                        <button
                            className="btn btn-add"
                            type="button"
                            onClick={() =>
                                navigate("/add-estoque")
                            }
                        >
                            + Item
                        </button>

                    </div>

                </div>


                {/* LISTA */}

                <div className="list">


                    {/* ABAS */}

                    <div className="tabs">

                        <button
                            className={
                                `tab-btn ${tab === "produtos"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                setTab("produtos")
                            }
                        >
                            Estoque Produtos
                        </button>


                        <button
                            className={
                                `tab-btn ${tab === "materiais"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                setTab("materiais")
                            }
                        >
                            Estoque Materiais
                        </button>

                    </div>


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

                            <p style={{
                                padding: "30px",
                                textAlign: "center"
                            }}>
                                Nenhum item encontrado.
                            </p>

                        ) : (

                            itensFiltrados.map((item) => {

                                const estoqueBaixo =
                                    Number(item.quantidade_atual) <=
                                    Number(item.estoque_minimo);


                                return (

                                    <div
                                        className="product estoque-row estoque-card"
                                        key={item.id}
                                    >

                                        {/* ITEM */}

                                        <div className="item-info">

                                            <div className="img"></div>


                                            <div className="produto estoque-main">

                                                <span className="mobile-field-label">
                                                    Item
                                                </span>

                                                <p>
                                                    {item.nome_item}
                                                </p>

                                            </div>

                                        </div>


                                        {/* CATEGORIA */}

                                        <div className="categoria info-block">

                                            <span className="mobile-field-label">
                                                Categoria
                                            </span>

                                            <p>
                                                {item.categoria}
                                            </p>

                                        </div>


                                        {/* QUANTIDADE */}

                                        <div className="quantidade info-block">

                                            <span className="mobile-field-label">
                                                Quantidade
                                            </span>

                                            <p>
                                                {item.quantidade_atual}
                                            </p>

                                        </div>


                                        {/* STATUS */}

                                        <div className="status-col info-block">

                                            <span className="mobile-field-label">
                                                Status
                                            </span>


                                            <span
                                                className={
                                                    estoqueBaixo
                                                        ? "status baixo"
                                                        : "status ok"
                                                }
                                            >

                                                {estoqueBaixo
                                                    ? "Baixo estoque"
                                                    : "Disponível"}

                                            </span>

                                        </div>


                                        {/* AÇÕES */}

                                        <div className="actions">

                                            <span className="mobile-field-label">
                                                Ações
                                            </span>


                                            <button
                                                className="action-btn"
                                                title="Editar"
                                                onClick={() =>
                                                    navigate(
                                                        `/editar-estoque/${item.id}`
                                                    )
                                                }
                                            >

                                                <span className="material-icons">
                                                    edit
                                                </span>

                                            </button>


                                            <button
                                                className="action-btn"
                                                title="Excluir"
                                                onClick={() =>
                                                    excluirItem(item.id)
                                                }
                                            >

                                                <span className="material-icons">
                                                    delete
                                                </span>

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