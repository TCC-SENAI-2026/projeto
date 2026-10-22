import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { api } from "../services/api";
import "../styles/padrao.css";
import "../styles/formulario.css";

function AddEstoque() {

    const navigate = useNavigate();
    const inputArteRef = useRef(null);

    const [form, setForm] = useState({
        tipo_item: "Produto",
        nome_item: "",
        categoria: "",
        unidade_medida: "",
        fornecedor: "",
        quantidade_atual: "",
        estoque_minimo: "",
        valor_unitario: "",
        observacoes: "",
        catalogo_item_id: "",
    });

    const [catalogoProdutos, setCatalogoProdutos] = useState([]);
    const [imagemFile, setImagemFile] = useState(null);
    const [imagemPreview, setImagemPreview] = useState(null);

    useEffect(() => {
        api.get('/catalogo/produtos')
            .then(data => setCatalogoProdutos(Array.isArray(data) ? data : []))
            .catch(() => setCatalogoProdutos([]));
    }, []);

    function handleArte(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (imagemPreview) URL.revokeObjectURL(imagemPreview);
        setImagemFile(file);
        setImagemPreview(URL.createObjectURL(file));
    }

    function removerArte() {
        if (imagemPreview) URL.revokeObjectURL(imagemPreview);
        setImagemFile(null);
        setImagemPreview(null);
        if (inputArteRef.current) inputArteRef.current.value = '';
    }

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

            const fd = new FormData();
            fd.append('tipo_item',        form.tipo_item);
            fd.append('nome_item',        form.nome_item);
            fd.append('categoria',        form.categoria);
            fd.append('unidade_medida',   form.unidade_medida);
            fd.append('fornecedor',       form.fornecedor || '');
            fd.append('quantidade_atual', Number(form.quantidade_atual || 0));
            fd.append('estoque_minimo',   Number(form.estoque_minimo || 0));
            fd.append('valor_unitario',   form.valor_unitario
                ? Number(form.valor_unitario.replace(',', '.'))
                : '');
            fd.append('observacoes',      form.observacoes || '');
            fd.append('catalogo_item_id', form.catalogo_item_id || '');
            if (imagemFile) fd.append('imagem', imagemFile);

            await api.postFile('/cadastrar-estoque', fd);

            alert("Item cadastrado com sucesso!");
            navigate("/estoque");

        } catch (erro) {

            console.log("Erro:", erro);
            alert(erro.message || "Erro ao cadastrar item.");
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


                                    {form.tipo_item === "Produto" && (
                                        <div className="form-field full">
                                            <label>Modelo do Catálogo</label>
                                            <select
                                                name="catalogo_item_id"
                                                value={form.catalogo_item_id}
                                                onChange={handleChange}
                                            >
                                                <option value="">Selecione (opcional)</option>
                                                {catalogoProdutos.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {form.tipo_item === "Produto" && (
                                        <div className="form-field full">
                                            <label>Foto do Produto</label>
                                            {imagemPreview && (
                                                <img
                                                    src={imagemPreview}
                                                    alt="prévia"
                                                    style={{ maxWidth: 160, maxHeight: 160, borderRadius: 8,
                                                             objectFit: 'contain', marginBottom: 8, display: 'block' }}
                                                />
                                            )}
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="btn-page-sec"
                                                    onClick={() => inputArteRef.current?.click()}>
                                                    {imagemPreview ? 'Trocar foto' : 'Escolher foto'}
                                                </button>
                                                {imagemPreview && (
                                                    <button type="button" className="btn-page-sec"
                                                        style={{ color: '#991b1b' }}
                                                        onClick={removerArte}>
                                                        Remover
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                ref={inputArteRef}
                                                type="file"
                                                accept=".png,.jpg,.jpeg,.webp,image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleArte}
                                            />
                                        </div>
                                    )}

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