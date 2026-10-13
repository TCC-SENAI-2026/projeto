import { useState, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import SelectOpcoes from "./SelectOpcoes";
import {
    TAMANHOS, PERSONALIZACOES, TECIDOS, CORES, LOCAIS, MODELOS, DETALHES_VAZIOS,
} from "../utils/opcoesProduto";

function EditarPedidoModal({ pedido, onFechar, onSalvar }) {
    const [ficha, setFicha] = useState({ ...(pedido.ficha || {}) });
    const [produtos, setProdutos] = useState(
        structuredClone(pedido.pedido?.produtos || [])
    );
    const [arte, setArte] = useState(pedido.pedido?.arte || null);
    const [novoModelo, setNovoModelo] = useState("");
    const [salvando, setSalvando] = useState(false);

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

    // ---------- arte ----------
    function handleArte(e) {
        const file = e.target.files[0];
        if (!file) return;
        // TODO(BACK): trocar base64 por upload (multipart/form-data) e guardar só a URL
        const reader = new FileReader();
        reader.onload = ev => setArte(ev.target.result);
        reader.readAsDataURL(file);
    }

    // ---------- salvar ----------
    async function handleSubmit(e) {
        e.preventDefault();

        const faltando = [];
        if (!ficha.cliente) faltando.push("Nome do cliente");
        if (!ficha.contato) faltando.push("Telefone");
        if (!ficha.email) faltando.push("E-mail");
        if (!ficha.dataPedido) faltando.push("Data do pedido");
        if (!ficha.entrega) faltando.push("Prazo de entrega");

        if (faltando.length > 0) {
            alert(`Preencha: ${faltando.join(", ")}`);
            return;
        }

        if (produtos.length === 0) {
            alert("O pedido precisa ter pelo menos um produto.");
            return;
        }



        const limpos = produtos.map(p => ({
            ...p,
            grade: Object.fromEntries(Object.entries(p.grade).filter(([, v]) => v > 0)),
        }));

        const semQtd = limpos.filter(p => Object.keys(p.grade).length === 0);
        if (semQtd.length > 0) {
            alert(`Preencha as quantidades de: ${semQtd.map(p => p.item).join(", ")}`);
            return;
        }

        setSalvando(true);
        try {
            await onSalvar({
                ...pedido,
                ficha,
                pedido: { ...(pedido.pedido || {}), produtos: limpos, arte },
            });
        } catch (erro) {
            alert(erro.message || "Não foi possível salvar as alterações.");
        } finally {
            setSalvando(false);
        }
    }

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


                        {/* DADOS DO CLIENTE */}
                        <section className="form-section">
                            <h2>Dados do Cliente</h2>
                            <div className="form-grid">
                                <div className="form-field full">
                                    <label htmlFor="e_cliente">Nome do Cliente</label>
                                    <input id="e_cliente" name="cliente" value={ficha.cliente || ""} onChange={handleFicha} required />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="e_contato">Telefone</label>
                                    <input id="e_contato" name="contato" value={ficha.contato || ""} onChange={handleFicha} required />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="e_email">E-mail</label>
                                    <input id="e_email" name="email" type="email" value={ficha.email || ""} onChange={handleFicha} required />
                                </div>
                            </div>
                        </section>

                        {/* LOGÍSTICA */}
                        <section className="form-section">
                            <h2>Detalhes Logísticos</h2>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label htmlFor="e_dataPedido">Data do Pedido</label>
                                    <input id="e_dataPedido" name="dataPedido" type="date" value={ficha.dataPedido || ""} onChange={handleFicha} required />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="e_entrega">Prazo de Entrega</label>
                                    <input id="e_entrega" name="entrega" type="date" value={ficha.entrega || ""} onChange={handleFicha} required />
                                </div>
                                <div className="form-field full">
                                    <p className="form-label-like">Prioridade</p>
                                    <div className="status-toggle">
                                        {[["baixa", "Baixa", "tg-verde"], ["media", "Média", "tg-amarelo"], ["alta", "Alta", "tg-vermelho"]].map(([v, t, cor]) => (
                                            <Fragment key={v}>
                                                <input type="radio" id={`e_prio_${v}`} name="prioridade" value={v}
                                                    checked={ficha.prioridade === v} onChange={handleFicha} />
                                                <label htmlFor={`e_prio_${v}`} className={cor}>{t}</label>
                                            </Fragment>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-field full">
                                    <label htmlFor="e_referencia">Referência</label>
                                    <input id="e_referencia" name="referencia" placeholder="Ex: INV 2026/12"
                                        value={ficha.referencia || ""} onChange={handleFicha} />
                                </div>
                            </div>
                        </section>

                        {/* PERSONALIZAÇÃO GERAL */}
                        <section className="form-section">
                            <h2>Personalização</h2>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label htmlFor="e_local">Local da Personalização</label>
                                    <select id="e_local" name="local" value={ficha.local || ""} onChange={handleFicha} required>
                                        <option value="">Selecione</option>
                                        {["Frente", "Costas", "Manga direita", "Manga esquerda", "Peito", "Gola"].map(o => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label htmlFor="e_personalizacao">Observação da Personalização</label>
                                    <input id="e_personalizacao" name="personalizacao" placeholder="Opcional"
                                        value={ficha.personalizacao || ""} onChange={handleFicha} />
                                </div>
                                <div className="form-field full">
                                    <label htmlFor="e_obs">Observações Gerais</label>
                                    <textarea id="e_obs" name="observacao" value={ficha.observacao || ""} onChange={handleFicha} />
                                </div>
                            </div>
                        </section>

                        {/* PRODUTOS */}
                        <section className="form-section">
                            <h2>Produtos</h2>
                            <p className="section-help">
                                Altere técnica, tecido, cor, local da arte e quantidades de cada item.
                            </p>

                            {produtos.map((p, i) => (
                                <div key={`${p.item}-${i}`} className="modelo-card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <h3 className="modelo-nome">{p.item}</h3>
                                        <button type="button" className="btn-page-sec" onClick={() => removerProduto(i)}>
                                            Remover
                                        </button>
                                    </div>

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
                                </div>
                            ))}

                            {disponiveis.length > 0 && (
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <select value={novoModelo} onChange={e => setNovoModelo(e.target.value)}>
                                        <option value="">Adicionar modelo...</option>
                                        {disponiveis.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                    </select>
                                    <button type="button" className="btn btn-add" onClick={adicionarProduto} disabled={!novoModelo}>
                                        + Adicionar
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* ARTE */}
                        <section className="form-section">
                            <h2>Arte do Cliente</h2>

                            {arte && (
                                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                                    <img src={arte} alt="Arte atual"
                                        style={{
                                            width: 100, height: 100, objectFit: "contain", borderRadius: 10,
                                            border: "1px solid #e2e8f0", background: "#f8fafc",
                                        }} />
                                    <button type="button" className="btn-page-sec" onClick={() => setArte(null)}>
                                        Remover arte
                                    </button>
                                </div>
                            )}

                            <label className="upload-arte" htmlFor="e-input-arte">
                                <span className="material-icons">upload_file</span>
                                <strong>{arte ? "Trocar arte" : "Enviar arte"}</strong>
                                <span>PNG, AI, PDF</span>
                                <input id="e-input-arte" type="file" accept=".png,.ai,.pdf,image/*"
                                    style={{ display: "none" }} onChange={handleArte} />
                            </label>
                        </section>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-page-sec" onClick={onFechar}>Cancelar</button>
                        <button type="submit" className="btn btn-add" disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar alterações"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default EditarPedidoModal;