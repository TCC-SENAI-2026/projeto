import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import SelectOpcoes from "./SelectOpcoes";
import CampoEditavel from "./CampoEditavel";
import { gerarAlteracoes } from "../utils/alteracoes";
import {
    TAMANHOS, PERSONALIZACOES, TECIDOS, CORES, LOCAIS, MODELOS, DETALHES_VAZIOS,
} from "../utils/opcoesProduto";

function EditarPedidoModal({ pedido, onFechar, onSalvar }) {
    const original = pedido.ficha || {};

    const [ficha, setFicha] = useState({ ...original });
    const [produtos, setProdutos] = useState(
        structuredClone(pedido.pedido?.produtos || [])
    );
    // Arte por produto: { [index]: base64DataURL }
    const [artes, setArtes] = useState({});
    const [novoModelo, setNovoModelo] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onFechar();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onFechar]);

    // ---------- dados gerais ----------
    function handleFicha(e) {
        const { name, value } = e.target;
        setFicha(prev => ({ ...prev, [name]: value }));
    }

    // ---------- produtos ----------
    function setDetalhe(index, campo, valor) {
        setProdutos(prev => prev.map((p, i) =>
            i === index ? { ...p, detalhes: { ...p.detalhes, [campo]: valor } } : p
        ));
    }

    function setQtd(index, tam, valor) {
        setProdutos(prev => prev.map((p, i) =>
            i === index ? { ...p, grade: { ...p.grade, [tam]: parseInt(valor) || 0 } } : p
        ));
    }

    function removerProduto(index) {
        setProdutos(prev => prev.filter((_, i) => i !== index));
        setArtes(prev => {
            const novo = {};
            Object.entries(prev).forEach(([k, v]) => {
                const ki = Number(k);
                if (ki < index) novo[ki] = v;
                else if (ki > index) novo[ki - 1] = v;
            });
            return novo;
        });
    }

    function adicionarProduto() {
        const modelo = MODELOS.find(m => m.id === novoModelo);
        if (!modelo) return;
        setProdutos(prev => [...prev, {
            item: modelo.label,
            grade: {},
            detalhes: { ...DETALHES_VAZIOS },
        }]);
        setNovoModelo("");
    }

    const disponiveis = MODELOS.filter(m => !produtos.some(p => p.item === m.label));

    // ---------- arte por produto ----------
    function handleArteItem(index, file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setArtes(prev => ({ ...prev, [index]: ev.target.result }));
        reader.readAsDataURL(file);
    }

    function removerArteItem(index) {
        setArtes(prev => {
            const novo = { ...prev };
            delete novo[index];
            return novo;
        });
    }

    // ---------- enviar solicitação ----------
    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        const faltando = [];
        if (!ficha.cliente) faltando.push("Nome do cliente");
        if (!ficha.contato) faltando.push("Telefone");
        if (!ficha.email) faltando.push("E-mail");
        if (!ficha.dataPedido) faltando.push("Data do pedido");
        if (!ficha.entrega) faltando.push("Prazo de entrega");

        if (faltando.length > 0) {
            setErro(`Preencha: ${faltando.join(", ")}`);
            return;
        }

        if (produtos.length === 0) {
            setErro("O pedido precisa ter pelo menos um produto.");
            return;
        }

        const limpos = produtos.map((p, i) => ({
            ...p,
            grade: Object.fromEntries(Object.entries(p.grade || {}).filter(([, v]) => v > 0)),
            detalhes: { ...p.detalhes, arteNova: artes[i] || null },
        }));

        const semQtd = limpos.filter(p => Object.keys(p.grade).length === 0);
        if (semQtd.length > 0) {
            setErro(`Preencha as quantidades de: ${semQtd.map(p => p.item).join(", ")}`);
            return;
        }

        const alteracoes = gerarAlteracoes(pedido, { ficha, produtos: limpos });
        if (alteracoes.length === 0) {
            setErro("Você ainda não alterou nada.");
            return;
        }

        setEnviando(true);
        try {
            await onSalvar({
                pedidoId: pedido.id,
                pedidoNovo: {
                    ficha,
                    pedido: { ...(pedido.pedido || {}), produtos: limpos },
                },
            });
        } catch (e2) {
            setErro(e2.message || "Não foi possível enviar a solicitação. Tente novamente.");
            setEnviando(false);
        }
    }

    const campo = (name, extra = {}) => ({
        id: `e_${name}`,
        name,
        valorOriginal: original[name],
        valor: ficha[name],
        onChange: handleFicha,
        ...extra,
    });

    return createPortal(
        <div className="fc-modal-overlay" onClick={onFechar}>
            <div
                className="fc-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="fc-modal-header">
                    <h2>Editar Pedido #{pedido.id}</h2>
                    <div className="fc-modal-acoes">
                        <button type="button" className="fc-modal-fechar" onClick={onFechar} aria-label="Fechar">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off" noValidate className="fc-form-editar">
                    <div className="fc-modal-body fc-body-editar">

                        <p className="fc-ajuda-edicao">
                            Clique em um campo para alterá-lo. As alterações são salvas diretamente.
                        </p>

                        {/* DADOS DO CLIENTE */}
                        <section className="form-section">
                            <h2>Dados do Cliente</h2>
                            <div className="form-grid">
                                <CampoEditavel {...campo("cliente", { rotulo: "Nome do Cliente", full: true })} />
                                <CampoEditavel {...campo("contato", { rotulo: "Telefone" })} />
                                <CampoEditavel {...campo("email", { rotulo: "E-mail", tipo: "email" })} />
                            </div>
                        </section>

                        {/* LOGÍSTICA */}
                        <section className="form-section">
                            <h2>Detalhes Logísticos</h2>
                            <div className="form-grid">
                                <CampoEditavel {...campo("dataPedido", { rotulo: "Data do Pedido", tipo: "date" })} />
                                <CampoEditavel {...campo("entrega", { rotulo: "Prazo de Entrega", tipo: "date" })} />
                            </div>
                        </section>

                        {/* OBSERVAÇÕES GERAIS */}
                        <section className="form-section">
                            <h2>Observações</h2>
                            <div className="form-grid">
                                <CampoEditavel {...campo("observacao", {
                                    rotulo: "Observações Gerais", tipo: "textarea", full: true,
                                })} />
                            </div>
                        </section>

                        {/* PRODUTOS */}
                        <section className="form-section">
                            <h2>Produtos</h2>
                            <p className="section-help">
                                Altere técnica, tecido, cor, local da arte, quantidades e arte de cada item.
                            </p>

                            {produtos.map((p, i) => (
                                <div key={`${p.item}-${i}`} className="modelo-card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <h3 className="modelo-nome">{p.item}</h3>
                                        <button type="button" className="btn-page-sec" onClick={() => removerProduto(i)}>
                                            Remover
                                        </button>
                                    </div>

                                    {/* Foto de referência do Estoque */}
                                    {p.detalhes?.estoque_id && (
                                        <div style={{ marginBottom: 10, textAlign: "center" }}>
                                            <img
                                                src={`/api/estoque/${p.detalhes.estoque_id}/imagem`}
                                                alt="Foto de referência"
                                                style={{
                                                    maxWidth: 80, maxHeight: 80, objectFit: "contain",
                                                    borderRadius: 6, border: "1px solid #e2e8f0",
                                                }}
                                            />
                                            <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
                                                Foto de referência
                                            </p>
                                        </div>
                                    )}

                                    <div className="modelo-selects">
                                        <SelectOpcoes label="Personalização" groups={PERSONALIZACOES}
                                            value={p.detalhes?.personalizacao || ""}
                                            onChange={e => setDetalhe(i, "personalizacao", e.target.value)} />
                                        <SelectOpcoes label="Tecido" groups={TECIDOS}
                                            value={p.detalhes?.tecido || ""}
                                            onChange={e => setDetalhe(i, "tecido", e.target.value)} />
                                        <SelectOpcoes label="Cor" groups={CORES}
                                            value={p.detalhes?.cor || ""}
                                            onChange={e => setDetalhe(i, "cor", e.target.value)} />
                                        <SelectOpcoes label="Local da Arte" groups={LOCAIS}
                                            value={p.detalhes?.local || ""}
                                            onChange={e => setDetalhe(i, "local", e.target.value)} />
                                        <div className="form-field">
                                            <label>Observações deste item</label>
                                            <textarea rows={2}
                                                value={p.detalhes?.observacao || ""}
                                                onChange={e => setDetalhe(i, "observacao", e.target.value)}
                                                style={{
                                                    width: "100%", borderRadius: 10, border: "1px solid #e2e8f0",
                                                    padding: "8px 12px", fontSize: 13, resize: "vertical", fontFamily: "inherit",
                                                }} />
                                        </div>
                                    </div>

                                    <div className="grade-tamanhos">
                                        {TAMANHOS.map(tam => (
                                            <div key={tam} className="item-tamanho">
                                                <label>{tam}</label>
                                                <input type="number" min="0"
                                                    value={p.grade?.[tam] || 0}
                                                    onChange={e => setQtd(i, tam, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Arte individual do produto */}
                                    <div className="arte-produto" style={{ marginTop: 12 }}>
                                        <p className="arte-produto-titulo">
                                            <span className="material-icons" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>image</span>
                                            Arte do Cliente
                                        </p>

                                        {(artes[i] || p.detalhes?.imagem_url) && (
                                            <img
                                                src={artes[i] || p.detalhes.imagem_url}
                                                alt={`Arte — ${p.item}`}
                                                style={{
                                                    maxWidth: 120, maxHeight: 120, objectFit: "contain",
                                                    borderRadius: 8, border: "1px solid #e2e8f0",
                                                    marginBottom: 8, display: "block",
                                                }}
                                            />
                                        )}

                                        <label className="upload-arte-mini" htmlFor={`arte-item-${i}`}>
                                            <span className="material-icons" style={{ fontSize: 16 }}>upload</span>
                                            {(artes[i] || p.detalhes?.imagem_url) ? "Trocar arte" : "Enviar arte"}
                                            <input
                                                id={`arte-item-${i}`}
                                                type="file"
                                                accept=".png,.ai,.pdf,image/*"
                                                style={{ display: "none" }}
                                                onChange={e => handleArteItem(i, e.target.files[0])}
                                            />
                                        </label>

                                        {artes[i] && (
                                            <button type="button" className="btn-page-sec"
                                                style={{ fontSize: 12, marginTop: 4 }}
                                                onClick={() => removerArteItem(i)}>
                                                Remover nova arte
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {disponiveis.length > 0 && (
                                <div className="adicionar-modelo-row">
                                    <span className="material-icons adicionar-modelo-icone">add_circle_outline</span>
                                    <select
                                        className="adicionar-modelo-select"
                                        value={novoModelo}
                                        onChange={e => setNovoModelo(e.target.value)}
                                    >
                                        <option value="">Selecionar modelo...</option>
                                        {disponiveis.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-add adicionar-modelo-btn"
                                        onClick={adicionarProduto}
                                        disabled={!novoModelo}
                                    >
                                        Adicionar modelo
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {erro && <div className="fc-erro-form" role="alert">{erro}</div>}

                    <div className="form-actions">
                        <button type="button" className="btn-page-sec" onClick={onFechar}>Cancelar</button>
                        <button type="submit" className="btn btn-add" disabled={enviando}>
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>save</span>
                            {enviando ? "Salvando..." : "Salvar alterações"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default EditarPedidoModal;
