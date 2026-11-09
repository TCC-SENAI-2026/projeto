import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CoresMaterial from "../components/CoresMaterial";
import { novaCorMaterial, prepararCoresMaterial } from "../utils/coresMaterial";
import { api } from "../services/api";
import "../styles/padrao.css";
import "../styles/formulario.css";

function EditarEstoque() {

    const navigate = useNavigate();
    const { id } = useParams();
    const inputArteRef = useRef(null);

    const [form, setForm] = useState({
        tipo_item: "Produto",
        nome_item: "",
        fornecedor: "",
        quantidade_atual: "",
        estoque_minimo: "",
        valor_unitario: "",
        observacoes: "",
        tem_variacoes: false,
        cores: [novaCorMaterial()],
    });

    const possuiVariacoes = form.tipo_item === "Material" && form.tem_variacoes;

    const [imagemFile, setImagemFile] = useState(null);
    const [imagemPreview, setImagemPreview] = useState(null);
    const [temImagemAtual, setTemImagemAtual] = useState(false);


    // BUSCAR ITEM PELO ID
    useEffect(() => {

        async function carregarItem() {
            try {
                const resposta = await api.get(`/estoque/${id}`);
                setForm(prev => ({
                    ...prev, ...resposta,
                    tem_variacoes: !!resposta.tem_variacoes,
                    cores: resposta.cores?.length ? resposta.cores : [novaCorMaterial()],
                    tipo_item: resposta.tipo_item?.toLowerCase() === 'material' ? 'Material' : 'Produto',
                }));
                setTemImagemAtual(!!resposta.tem_imagem);
            } catch (erro) {
                console.log("Erro ao buscar item:", erro);
                alert("Erro ao carregar item.");
                navigate("/estoque");
            }
        }

        carregarItem();

    }, [id, navigate]);

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


    // SALVAR ALTERAÇÕES
    async function handleSubmit(e) {

        e.preventDefault();

        try {

            const cores = possuiVariacoes ? prepararCoresMaterial(form.cores) : [];
            const fd = new FormData();
            fd.append('tem_variacoes', possuiVariacoes);
            fd.append('cores', JSON.stringify(cores));
            fd.append('tipo_item',        form.tipo_item.toLowerCase());
            fd.append('nome_item',        form.nome_item);
            fd.append('fornecedor',       form.fornecedor || '');
            fd.append('quantidade_atual', Number(form.quantidade_atual || 0));
            fd.append('estoque_minimo',   Number(form.estoque_minimo || 0));
            fd.append('valor_unitario',   form.valor_unitario
                ? Number(String(form.valor_unitario).replace(',', '.'))
                : '');
            fd.append('observacoes',      form.observacoes || '');
            if (imagemFile) fd.append('imagem', imagemFile);

            await api.putFile(`/editar-estoque/${id}`, fd);

            alert("Item atualizado com sucesso!");
            navigate("/estoque");

        } catch (erro) {

            console.log("Erro ao editar:", erro);
            alert(erro.message || "Erro ao editar item.");
        }
    }


    return (
        <>
            <Sidebar />

            <div className="container">

                <div className="form-page-layout estoque-form-layout">

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

                                    {form.tipo_item === "Material" && (
                                        <div className="form-field full">
                                            <label className="variacoes-material-checkbox">
                                                <input type="checkbox" checked={form.tem_variacoes}
                                                    onChange={e => setForm(prev => ({
                                                        ...prev,
                                                        tem_variacoes: e.target.checked,
                                                        cores: prev.cores.length ? prev.cores : [novaCorMaterial()],
                                                    }))} />
                                                Transformar em categoria de tecido (com cores)
                                            </label>
                                        </div>
                                    )}


                                    {form.tipo_item === "Produto" && (
                                        <div className="form-field full">
                                            <label>Foto do Produto</label>
                                            {(imagemPreview || temImagemAtual) && (
                                                <img
                                                    src={imagemPreview || `/api/estoque/${id}/imagem`}
                                                    alt="foto do produto"
                                                    style={{ maxWidth: 160, maxHeight: 160, borderRadius: 8,
                                                             objectFit: 'contain', marginBottom: 8, display: 'block' }}
                                                />
                                            )}
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="btn-page-sec"
                                                    onClick={() => inputArteRef.current?.click()}>
                                                    {(imagemPreview || temImagemAtual) ? 'Trocar foto' : 'Escolher foto'}
                                                </button>
                                                {(imagemPreview || temImagemAtual) && (
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

                                    {!possuiVariacoes && (
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
                                    )}


                                    {!possuiVariacoes && (
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
                                    )}


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


                            {possuiVariacoes && (
                                <CoresMaterial cores={form.cores}
                                    onChange={cores => setForm(prev => ({ ...prev, cores }))} />
                            )}


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