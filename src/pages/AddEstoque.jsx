import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";

function AddEstoque() {

    const navigate = useNavigate();

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


    function handleChange(e) {

        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    }


    async function handleSubmit(e) {

        e.preventDefault();

        if (!form.nome_item) {
            alert("Informe o nome do item.");
            return;
        }

        if (!form.categoria) {
            alert("Selecione uma categoria.");
            return;
        }

        if (!form.unidade_medida) {
            alert("Selecione a unidade de medida.");
            return;
        }

        try {

            await axios.post(
                "http://localhost:5000/cadastrar-estoque",
                {
                    ...form,

                    quantidade_atual:
                        Number(form.quantidade_atual || 0),

                    estoque_minimo:
                        Number(form.estoque_minimo || 0),

                    valor_unitario:
                        form.valor_unitario
                            ? Number(
                                form.valor_unitario.replace(",", ".")
                            )
                            : null
                }
            );

            alert("Item cadastrado com sucesso!");

            navigate("/estoque");

        } catch (erro) {

            console.log("Erro:", erro);
            console.log("Resposta:", erro.response?.data);

            alert(
                erro.response?.data?.message ||
                "Erro ao cadastrar item."
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
                                    inventory_2
                                </span>

                                Movimentação
                            </span>

                            <h1 className="form-title">
                                Adicionar Itens
                            </h1>

                            <p className="form-subtitle">
                                Formulário para movimentação de itens do estoque.
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
                                    Selecione o tipo que será cadastrado.
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
                                    Informe os dados principais do item.
                                </p>


                                <div className="form-grid">

                                    <div className="form-field full">

                                        <label>Nome do item</label>

                                        <input
                                            type="text"
                                            name="nome_item"
                                            value={form.nome_item}
                                            onChange={handleChange}
                                            placeholder="Ex.: Camiseta Polo Azul Marinho"
                                            required
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>Categoria</label>

                                        <select
                                            name="categoria"
                                            value={form.categoria}
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
                                            value={form.unidade_medida}
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
                                            value={form.fornecedor}
                                            onChange={handleChange}
                                            placeholder="Ex.: Tecidos Brasil"
                                        />

                                    </div>

                                </div>

                            </section>


                            {/* CONTROLE */}

                            <section className="form-section">

                                <h2>Controle de estoque</h2>

                                <p className="section-help">
                                    Informe quantidade e valor do item.
                                </p>


                                <div className="form-grid">

                                    <div className="form-field">

                                        <label>Quantidade atual</label>

                                        <input
                                            type="number"
                                            name="quantidade_atual"
                                            value={form.quantidade_atual}
                                            onChange={handleChange}
                                            min="0"
                                            placeholder="0"
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>Estoque mínimo</label>

                                        <input
                                            type="number"
                                            name="estoque_minimo"
                                            value={form.estoque_minimo}
                                            onChange={handleChange}
                                            min="0"
                                            placeholder="Ex.: 20"
                                        />

                                    </div>


                                    <div className="form-field full">

                                        <label>Valor unitário</label>

                                        <input
                                            type="text"
                                            name="valor_unitario"
                                            value={form.valor_unitario}
                                            onChange={handleChange}
                                            placeholder="Ex.: 39,90"
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
                                            value={form.observacoes}
                                            onChange={handleChange}
                                            placeholder="Ex.: item reservado para pedido da empresa X"
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
                                    Cadastrar item
                                </button>

                            </div>

                        </form>

                    </main>

                </div>

            </div>
        </>
    );
}

export default AddEstoque;