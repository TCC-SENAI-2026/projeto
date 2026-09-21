import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/novoPedido.css";

const TAMANHOS = ["P", "M", "G", "GG", "G1", "G2"];

const PERSONALIZACOES = [
    { group: "Básicos", options: ["Bordado", "Silk Screen (Serigrafia)", "Estampa Digital (DTG)", "Sublimação", "Transfer", "Vinil Termocolante"] },
    { group: "Intermediários", options: ["Relevo (3D Puff)", "Bordado 3D", "Patch (Aplicação)", "Termocolante", "Foil (Metalizado)", "Flocado (Aveludado)"] },
    { group: "Avançados", options: ["Laser Cut", "Gravação a Laser", "Estampa UV", "Impressão 3D", "Pedraria", "Lantejoulas"] },
    { group: "Efeitos / Estilo", options: ["Transparente", "Degradê", "Brilho (Glitter)", "Fosco"] },
];

const TECIDOS = [
    { group: "Básicos", options: ["Algodão", "Poliéster", "Malha", "Viscose"] },
    { group: "Intermediários", options: ["Algodão + Poliéster", "Algodão + Elastano", "Poliéster + Elastano", "Viscolycra", "Dry Fit", "Piquet"] },
    { group: "Avançados", options: ["Algodão Pima", "Algodão Egípcio", "Fleece", "Moletom Felpado", "Linho", "Seda"] },
    { group: "Sustentáveis", options: ["Modal", "Fibra de Bambu", "Poliéster de PET Reciclado"] },
    { group: "Especiais", options: ["Jeans", "Sarja", "Nylon", "Helanca", "Suplex"] },
];

const CORES = [
    { group: "Básicas", options: ["Branco", "Preto", "Cinza", "Azul", "Vermelho"] },
    { group: "Neutras / Sóbrias", options: ["Off-white", "Bege", "Marrom", "Caqui", "Grafite"] },
    { group: "Intermediárias", options: ["Azul Marinho", "Verde Militar", "Vinho", "Mostarda", "Rosa Claro"] },
    { group: "Vibrantes", options: ["Verde Limão", "Azul Ciano", "Laranja", "Pink", "Roxo"] },
    { group: "Especiais", options: ["Metálico", "Neon", "Pastel", "Tie-dye", "Estampado"] },
];

// NOVO: locais possíveis de personalização
const LOCAIS = [
    { group: "Frente", options: ["Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito", "Frente — Abaixo do Peito"] },
    { group: "Costas", options: ["Costas — Centro Alto", "Costas — Centro Baixo", "Costas — Full Back"] },
    { group: "Mangas", options: ["Manga Esquerda", "Manga Direita", "Ambas as Mangas"] },
    { group: "Outros", options: ["Gola", "Bolso", "Barra", "Capuz"] },
];

const MODELOS = [
    { id: "camiseta",     label: "Camiseta",        icon: "checkroom" },
    { id: "camisa",       label: "Camisa",           icon: "checkroom" },
    { id: "camisa_longa", label: "Camisa Longa",     icon: "checkroom" },
    { id: "moletom",      label: "Moletom c/ Capuz", icon: "checkroom" },
    { id: "calca",        label: "Calça",            icon: "checkroom" },
];

function SelectOpcoes({ label, groups, value, onChange }) {
    return (
        <div className="form-field">
            <label>{label}</label>
            <select value={value} onChange={onChange}>
                <option value="">Selecione</option>
                {groups.map(g => (
                    <optgroup key={g.group} label={g.group}>
                        {g.options.map(o => (
                            <option key={o} value={o}>{o}</option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}

function ModeloCard({ modelo, dados, onChange, selecionado, onToggle }) {
    return (
        <div className={`modelo-card ${selecionado ? "selecionado" : ""}`}>

            {/* FRENTE — configuração */}
            {!selecionado && (
                <div className="modelo-frente">
                    <div className="modelo-icon">
                        <span className="material-icons">{modelo.icon}</span>
                    </div>

                    <h3 className="modelo-nome">{modelo.label}</h3>

                    <div className="modelo-selects">
                        <SelectOpcoes
                            label="Personalização"
                            groups={PERSONALIZACOES}
                            value={dados.personalizacao}
                            onChange={e => onChange("personalizacao", e.target.value)}
                        />
                        <SelectOpcoes
                            label="Tecido"
                            groups={TECIDOS}
                            value={dados.tecido}
                            onChange={e => onChange("tecido", e.target.value)}
                        />
                        <SelectOpcoes
                            label="Cor"
                            groups={CORES}
                            value={dados.cor}
                            onChange={e => onChange("cor", e.target.value)}
                        />
                        {/* NOVO: local da arte por item */}
                        <SelectOpcoes
                            label="Local da Arte"
                            groups={LOCAIS}
                            value={dados.local}
                            onChange={e => onChange("local", e.target.value)}
                        />
                        {/* NOVO: observação por item */}
                        <div className="form-field">
                            <label>Observações deste item</label>
                            <textarea
                                rows={2}
                                placeholder="Ex: bordado em linha branca, repetir no bolso..."
                                value={dados.observacao}
                                onChange={e => onChange("observacao", e.target.value)}
                                style={{
                                    width: "100%",
                                    borderRadius: 10,
                                    border: "1px solid #e2e8f0",
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-add modelo-btn"
                        onClick={onToggle}
                    >
                        Selecionar
                    </button>
                </div>
            )}

            {/* VERSO — quantidades por tamanho */}
            {selecionado && (
                <div className="modelo-verso">
                    <h3 className="modelo-nome">{modelo.label}</h3>

                    <p className="section-help" style={{ marginBottom: 16 }}>
                        {dados.cor          && <span className="tag-detalhe">{dados.cor}</span>}
                        {dados.tecido       && <span className="tag-detalhe">{dados.tecido}</span>}
                        {dados.personalizacao && <span className="tag-detalhe">{dados.personalizacao}</span>}
                        {dados.local        && (
                            <span className="tag-detalhe" style={{ background: "#f3e8ff", color: "#6b21a8" }}>
                                {dados.local}
                            </span>
                        )}
                    </p>

                    <div className="grade-tamanhos">
                        {TAMANHOS.map(tam => (
                            <div key={tam} className="item-tamanho">
                                <label>{tam}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={dados.quantidades[tam] || 0}
                                    onChange={e => onChange(`qtd_${tam}`, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    {dados.observacao && (
                        <p style={{
                            marginTop: 12,
                            fontSize: 12,
                            color: "#64748b",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "8px 12px",
                        }}>
                            <strong>Obs.:</strong> {dados.observacao}
                        </p>
                    )}

                    <button
                        type="button"
                        className="btn-page-sec modelo-btn"
                        onClick={onToggle}
                    >
                        Desmarcar
                    </button>
                </div>
            )}

        </div>
    );
}

function SelecionarProdutos() {
    const navigate = useNavigate();

    const [modelos, setModelos] = useState(() =>
        Object.fromEntries(MODELOS.map(m => [
            m.id,
            {
                personalizacao: "",
                tecido: "",
                cor: "",
                local: "",        // NOVO
                observacao: "",   // NOVO
                quantidades: {},
                selecionado: false,
            }
        ]))
    );

    // CORREÇÃO: guarda a arte em state próprio, separado dos produtos
    const [artePreview, setArtePreview] = useState(null);
    const [arteBase64, setArteBase64] = useState(null);

    function handleChange(modeloId, campo, valor) {
        setModelos(prev => {
            const atual = { ...prev[modeloId] };

            if (campo.startsWith("qtd_")) {
                const tam = campo.replace("qtd_", "");
                atual.quantidades = { ...atual.quantidades, [tam]: parseInt(valor) || 0 };
            } else {
                atual[campo] = valor;
            }

            return { ...prev, [modeloId]: atual };
        });
    }

    function handleToggle(modeloId) {
        setModelos(prev => ({
            ...prev,
            [modeloId]: {
                ...prev[modeloId],
                selecionado: !prev[modeloId].selecionado,
                quantidades: !prev[modeloId].selecionado
                    ? prev[modeloId].quantidades
                    : {},
            }
        }));
    }

    function handleArte(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            setArteBase64(ev.target.result);
            setArtePreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    }

    function handleContinuar() {
        const selecionados = MODELOS
            .filter(m => modelos[m.id].selecionado)
            .map(m => {
                const d = modelos[m.id];
                const grade = Object.fromEntries(
                    Object.entries(d.quantidades).filter(([, v]) => v > 0)
                );
                return {
                    item: m.label,
                    grade,
                    detalhes: {
                        tecido:        d.tecido,
                        cor:           d.cor,
                        personalizacao: d.personalizacao,
                        local:         d.local,         // NOVO
                        observacao:    d.observacao,    // NOVO
                    },
                };
            });

        if (selecionados.length === 0) {
            alert("Selecione pelo menos um produto.");
            return;
        }

        const semQtd = selecionados.filter(p => Object.keys(p.grade).length === 0);
        if (semQtd.length > 0) {
            alert(`Preencha as quantidades de: ${semQtd.map(p => p.item).join(", ")}`);
            return;
        }

        // CORREÇÃO: arte salva junto aos produtos, sem sobrescrever
        localStorage.setItem(
            "detalhesPedido",
            JSON.stringify({ produtos: selecionados, arte: arteBase64 })
        );

        navigate("/pedidos/novo/ficha");
    }

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="form-page-card">

                    <div className="form-header">
                        <span className="form-badge">
                            <span className="material-icons">inventory_2</span>
                            Novo Pedido
                        </span>
                        <h1 className="form-title">Selecionar Produtos</h1>
                        <p className="form-subtitle">
                            Escolha os modelos, configure cor, tecido, técnica e local da arte de cada um.
                        </p>
                    </div>

                    {/* STEPPER */}
                    <div className="pedido-stepper">
                        <div className="pedido-step completed">
                            <div className="step-circle">✓</div>
                            <span>Identificação</span>
                        </div>
                        <div className="pedido-step-line completed" />
                        <div className="pedido-step active">
                            <div className="step-circle">2</div>
                            <span>Produtos</span>
                        </div>
                        <div className="pedido-step-line" />
                        <div className="pedido-step">
                            <div className="step-circle">3</div>
                            <span>Finalização</span>
                        </div>
                    </div>

                    <section className="form-section">
                        <h2>Modelos disponíveis</h2>
                        <p className="section-help">
                            Configure cada modelo individualmente — técnica, tecido, cor, local da arte e observações.
                            Depois clique em "Selecionar" para definir as quantidades por tamanho.
                        </p>

                        <div className="modelos-grid">
                            {MODELOS.map(m => (
                                <ModeloCard
                                    key={m.id}
                                    modelo={m}
                                    dados={modelos[m.id]}
                                    selecionado={modelos[m.id].selecionado}
                                    onChange={(campo, valor) => handleChange(m.id, campo, valor)}
                                    onToggle={() => handleToggle(m.id)}
                                />
                            ))}
                        </div>
                    </section>

                    {/* UPLOAD DE ARTE — agora com preview e state próprio */}
                    <section className="form-section">
                        <h2>Arte do Cliente</h2>
                        <p className="section-help">
                            Envie a arte para personalização. Ela será aplicada nos itens conforme a técnica
                            de cada um. Formatos aceitos: PNG, AI, PDF.
                        </p>

                        <label className="upload-arte" htmlFor="input-arte">
                            <span className="material-icons">upload_file</span>
                            <strong>Arraste sua arte aqui</strong>
                            <span>ou clique para enviar — PNG, AI, PDF</span>
                            <input
                                id="input-arte"
                                type="file"
                                accept=".png,.ai,.pdf,image/*"
                                style={{ display: "none" }}
                                onChange={handleArte}
                            />
                        </label>

                        {/* Preview da arte após upload */}
                        {artePreview && (
                            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
                                <img
                                    src={artePreview}
                                    alt="Preview da arte"
                                    style={{
                                        width: 100,
                                        height: 100,
                                        objectFit: "contain",
                                        borderRadius: 10,
                                        border: "1px solid #e2e8f0",
                                        background: "#f8fafc",
                                    }}
                                />
                                <div>
                                    <p style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
                                        ✓ Arte carregada com sucesso
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-page-sec"
                                        style={{ marginTop: 6, fontSize: 12 }}
                                        onClick={() => { setArtePreview(null); setArteBase64(null); }}
                                    >
                                        Remover arte
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-page-sec"
                            onClick={() => navigate("/pedidos/novo")}
                        >
                            Voltar
                        </button>
                        <button
                            type="button"
                            className="btn btn-add"
                            onClick={handleContinuar}
                        >
                            Revisar Ficha Técnica
                            <span className="material-icons" style={{ fontSize: 18, marginLeft: 6 }}>arrow_forward</span>
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}

export default SelecionarProdutos;