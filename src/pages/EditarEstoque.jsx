import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";

function EditarEstoque() {

    const navigate = useNavigate();
    const { id } = useParams();

    const [form, setForm] = useState({
        tipo_item: "Produto",
        nome_item: "",
        categoria: "",
        unidade_medida: "",
        fornecedor: "",
        quantidade_atual: "",
        estoque_minimo: "",
        valor_unitario: "",
        observacoes: ""
    });


    // BUSCAR ITEM PELO ID
    useEffect(() => {

        async function carregarItem() {

            try {

                const resposta = await axios.get(
                    `http://localhost:5000/estoque/${id}`
                );

                setForm(resposta.data);

            } catch (erro) {

                console.log("Erro ao buscar item:", erro);

                alert("Erro ao carregar item.");

                navigate("/estoque");
            }
        }

        carregarItem();

    }, [id, navigate]);


    function handleChange(e) {

        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    }


    // SALVAR ALTERAÇÕES
    async function handleSubmit(e) {

        e.preventDefault();

        try {

            await axios.put(
                `http://localhost:5000/editar-estoque/${id}`,
                {
                    ...form,

                    quantidade_atual:
                        Number(form.quantidade_atual || 0),

                    estoque_minimo:
                        Number(form.estoque_minimo || 0),

                    valor_unitario:
                        form.valor_unitario
                            ? Number(
                                String(form.valor_unitario)
                                    .replace(",", ".")
                            )
                            : null
                }
            );

            alert("Item atualizado com sucesso!");

            navigate("/estoque");

        } catch (erro) {

            console.log("Erro ao editar:", erro);
            console.log(erro.response?.data);

            alert(
                erro.response?.data?.message ||
                "Erro ao editar item."
            );
        }
    }


    return (
        <>
            <Sidebar />

            <div className="container">

                <div className="form-page-layout">

                    <main className="form-card">

                        <div className="form-header">

                            <span className="form-badge">
                                <span className="material-icons">
                                    edit
                                </span>

                                ESTOQUE
                            </span>

                            <h1 className="form-title">
                                Editar Item
                            </h1>

                            <p className="form-subtitle">
                                Altere as informações do item selecionado.
                            </p>

                        </div>


                        <form
                            onSubmit={handleSubmit}
                            autoComplete="off"
                        >

                            {/* TIPO */}

                            <section className="form-section">

                                <h2>Tipo de item</h2>

                                <p className="section-help">
                                    Selecione o tipo do item.
                                </p>

                                <div className="type-switch">

                                    <label>

                                        <input
                                            type="radio"
                                            name="tipo_item"
                                            value="Produto"
                                            checked={
                                                form.tipo_item === "Produto"
                                            }
                                            onChange={handleChange}
                                        />

                                        <span className="type-card">
                                            <strong>Produto</strong>

                                            <span>
                                                Item pronto para venda ou entrega.
                                            </span>
                                        </span>

                                    </label>


                                    <label>

                                        <input
                                            type="radio"
                                            name="tipo_item"
                                            value="Material"
                                            checked={
                                                form.tipo_item === "Material"
                                            }
                                            onChange={handleChange}
                                        />

                                        <span className="type-card">
                                            <strong>Material</strong>

                                            <span>
                                                Matéria-prima ou insumo usado na produção.
                                            </span>
                                        </span>

                                    </label>

                                </div>

                            </section>


                            {/* IDENTIFICAÇÃO */}

                            <section className="form-section">

                                <h2>Identificação do item</h2>

                                <p className="section-help">
                                    Edite os dados principais do item.
                                </p>

                                <div className="form-grid">

                                    <div className="form-field full">

                                        <label>Nome do item</label>

                                        <input
                                            type="text"
                                            name="nome_item"
                                            value={form.nome_item || ""}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>Categoria</label>

                                        <select
                                            name="categoria"
                                            value={form.categoria || ""}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">
                                                Selecione
                                            </option>

                                            <option value="Uniforme">
                                                Uniforme
                                            </option>

                                            <option value="Malharia">
                                                Malharia
                                            </option>

                                            <option value="Tecido">
                                                Tecido
                                            </option>
                                        </select>

                                    </div>


                                    <div className="form-field">

                                        <label>Unidade de medida</label>

                                        <select
                                            name="unidade_medida"
                                            value={form.unidade_medida || ""}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">
                                                Selecione
                                            </option>

                                            <option value="Unidade">
                                                Unidade
                                            </option>

                                            <option value="Peça">
                                                Peça
                                            </option>

                                            <option value="Metro">
                                                Metro
                                            </option>
                                        </select>

                                    </div>


                                    <div className="form-field">

                                        <label>Fornecedor</label>

                                        <input
                                            type="text"
                                            name="fornecedor"
                                            value={form.fornecedor || ""}
                                            onChange={handleChange}
                                        />

                                    </div>

                                </div>

                            </section>


                            {/* ESTOQUE */}

                            <section className="form-section">

                                <h2>Controle de estoque</h2>

                                <p className="section-help">
                                    Altere quantidade e valor do item.
                                </p>

                                <div className="form-grid">

                                    <div className="form-field">

                                        <label>Quantidade atual</label>

                                        <input
                                            type="number"
                                            name="quantidade_atual"
                                            value={form.quantidade_atual ?? ""}
                                            onChange={handleChange}
                                            min="0"
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>Estoque mínimo</label>

                                        <input
                                            type="number"
                                            name="estoque_minimo"
                                            value={form.estoque_minimo ?? ""}
                                            onChange={handleChange}
                                            min="0"
                                        />

                                    </div>


                                    <div className="form-field full">

                                        <label>Valor unitário</label>

                                        <input
                                            type="text"
                                            name="valor_unitario"
                                            value={form.valor_unitario ?? ""}
                                            onChange={handleChange}
                                        />

                                    </div>

                                </div>

                            </section>


                            {/* OBSERVAÇÕES */}

                            <section className="form-section">

                                <div className="form-grid">

                                    <div className="form-field full">

                                        <label>
                                            Observações gerais
                                        </label>

                                        <textarea
                                            name="observacoes"
                                            value={form.observacoes || ""}
                                            onChange={handleChange}
                                        />

                                    </div>

                                </div>

                            </section>


                            {/* BOTÕES */}

                            <div className="form-actions">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        navigate("/estoque")
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-add"
                                >
                                    Salvar alterações
                                </button>

                            </div>

                        </form>

                    </main>

                </div>

            </div>
        </>
    );
}

export default EditarEstoque;   