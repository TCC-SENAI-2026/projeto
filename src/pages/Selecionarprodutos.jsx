import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SelectOpcoes from "../components/SelectOpcoes";
import {
    TAMANHOS, PERSONALIZACOES, TECIDOS, CORES, LOCAIS,
    LOCAIS_POR_PRODUTO, MODELOS,
} from "../utils/opcoesProduto";
import { api } from "../services/api";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/Novopedido.css";

const TIPOS_IMAGEM = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

function obterExtensao(nome) {
    return (nome || '').split('.').pop().toLowerCase();
}

// Filtra os grupos de Local da Arte conforme os locais permitidos para o modelo
function locaisPorModelo(modeloId) {
    const permitidos = LOCAIS_POR_PRODUTO[modeloId];
    if (!permitidos) return LOCAIS;
    const set = new Set(permitidos);
    return LOCAIS
        .map(g => ({ ...g, options: g.options.filter(opt => set.has(opt)) }))
        .filter(g => g.options.length > 0);
}

// Card individual de produto com arte própria
function ModeloCard({ modelo, dados, arte, onChange, onArte, onRemoverArte, selecionado, onToggle,
                      estoqueItens = [], estoqueId = null, onEstoqueChange }) {

    const fotoProduto = estoqueId
        ? (estoqueItens.find(e => e.id === estoqueId)?.tem_imagem
            ? `/api/estoque/${estoqueId}/imagem`
            : null)
        : (estoqueItens.length === 1 && estoqueItens[0].tem_imagem
            ? `/api/estoque/${estoqueItens[0].id}/imagem`
            : null);

    return (
        <div className={`modelo-card ${selecionado ? 'selecionado' : ''}`}>

            {/* FRENTE — configuração */}
            {!selecionado && (
                <div className="modelo-frente">
                    <div className="modelo-icon">
                        {fotoProduto ? (
                            <img src={fotoProduto} alt={modelo.label}
                                 style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8 }} />
                        ) : (
                            <span className="material-icons">{modelo.icon}</span>
                        )}
                    </div>

                    {estoqueItens.length > 1 && (
                        <div className="form-field" style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 12 }}>Modelo do estoque</label>
                            <select value={estoqueId || ''} onChange={e => onEstoqueChange(Number(e.target.value) || null)}
                                    style={{ fontSize: 12 }}>
                                <option value="">Selecione</option>
                                {estoqueItens.map(e => (
                                    <option key={e.id} value={e.id}>{e.nome_item}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <h3 className="modelo-nome">{modelo.label}</h3>

                    <div className="modelo-selects">
                        <SelectOpcoes
                            label="Personalização"
                            groups={PERSONALIZACOES}
                            value={dados.personalizacao}
                            onChange={e => onChange('personalizacao', e.target.value)}
                        />
                        <SelectOpcoes
                            label="Tecido"
                            groups={TECIDOS}
                            value={dados.tecido}
                            onChange={e => onChange('tecido', e.target.value)}
                        />
                        <SelectOpcoes
                            label="Cor"
                            groups={CORES}
                            value={dados.cor}
                            onChange={e => onChange('cor', e.target.value)}
                        />
                        <SelectOpcoes
                            label="Local da Arte"
                            groups={locaisPorModelo(modelo.id)}
                            value={dados.local}
                            onChange={e => onChange('local', e.target.value)}
                        />
                        <div className="form-field">
                            <label>Observações deste item</label>
                            <textarea
                                rows={2}
                                placeholder="Ex: bordado em linha branca..."
                                value={dados.observacao}
                                onChange={e => onChange('observacao', e.target.value)}
                                className="modelo-textarea"
                            />
                        </div>
                    </div>

                    <button type="button" className="btn btn-add modelo-btn" onClick={onToggle}>
                        Selecionar
                    </button>
                </div>
            )}

            {/* VERSO — quantidades + arte */}
            {selecionado && (
                <div className="modelo-verso">
                    <h3 className="modelo-nome">{modelo.label}</h3>

                    <p className="section-help" style={{ marginBottom: 16 }}>
                        {dados.cor          && <span className="tag-detalhe">{dados.cor}</span>}
                        {dados.tecido       && <span className="tag-detalhe">{dados.tecido}</span>}
                        {dados.personalizacao && <span className="tag-detalhe">{dados.personalizacao}</span>}
                        {dados.local        && (
                            <span className="tag-detalhe" style={{ background: '#f3e8ff', color: '#6b21a8' }}>
                                {dados.local}
                            </span>
                        )}
                    </p>

                    {/* Quantidades por tamanho */}
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
                        <p className="modelo-obs">
                            <strong>Obs.:</strong> {dados.observacao}
                        </p>
                    )}

                    {/* Arte individual deste produto */}
                    <div className="arte-produto">
                        <p className="arte-produto-titulo">
                            <span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>image</span>
                            Arte do Cliente
                        </p>

                        {arte?.file && (
                            <div className="arte-preview-wrapper">
                                {arte.temPreview && arte.preview ? (
                                    <img
                                        src={arte.preview}
                                        alt="Arte do produto"
                                        className="arte-preview-img"
                                    />
                                ) : (
                                    <div className="arte-sem-preview">
                                        <span className="material-icons">insert_drive_file</span>
                                        <span>{arte.nome}</span>
                                    </div>
                                )}
                                <p className="arte-nome-arquivo">{arte.nome}</p>
                            </div>
                        )}

                        <label className="upload-arte-mini" htmlFor={`arte-${modelo.id}`}>
                            <span className="material-icons" style={{ fontSize: 16 }}>upload</span>
                            {arte?.file ? 'Trocar arte' : 'Escolher arte'}
                            <input
                                id={`arte-${modelo.id}`}
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf,.ai,image/*"
                                style={{ display: 'none' }}
                                onChange={e => onArte(e.target.files[0])}
                            />
                        </label>

                        {arte?.file && (
                            <button
                                type="button"
                                className="btn-page-sec"
                                style={{ fontSize: 12, marginTop: 4 }}
                                onClick={onRemoverArte}
                            >
                                Remover arte
                            </button>
                        )}
                    </div>

                    <button type="button" className="btn-page-sec modelo-btn" onClick={onToggle}>
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
            { personalizacao: '', tecido: '', cor: '', local: '', observacao: '', quantidades: {}, selecionado: false }
        ]))
    );

    // Arte individual por produto: { modeloId: { file, preview, nome, temPreview } }
    const [artes, setArtes] = useState({});

    // Fotos do estoque por modelo: { modeloId: [{id, nome_item, tem_imagem}] }
    const [estoquesPorModelo, setEstoquesPorModelo] = useState({});
    // Estoque selecionado por modelo (quando há mais de um item)
    const [estoqueIds, setEstoqueIds] = useState({});

    useEffect(() => {
        api.get('/catalogo/produtos', { lista: true })
            .then(prods => {
                if (!Array.isArray(prods)) return;
                MODELOS.forEach(m => {
                    const cat = prods.find(p => p.nome.toLowerCase() === m.label.toLowerCase());
                    if (!cat) return;
                    api.get(`/estoque/por-catalogo/${cat.id}`, { lista: true })
                        .then(itens => {
                            if (!Array.isArray(itens) || itens.length === 0) return;
                            setEstoquesPorModelo(prev => ({ ...prev, [m.id]: itens }));
                            if (itens.length === 1) {
                                setEstoqueIds(prev => ({ ...prev, [m.id]: itens[0].id }));
                            }
                        })
                        .catch(() => {});
                });
            })
            .catch(() => {});
    }, []);

    function handleChange(modeloId, campo, valor) {
        setModelos(prev => {
            const atual = { ...prev[modeloId] };
            if (campo.startsWith('qtd_')) {
                const tam = campo.replace('qtd_', '');
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
                quantidades: !prev[modeloId].selecionado ? prev[modeloId].quantidades : {},
            }
        }));
    }

    function handleArte(modeloId, arquivo) {
        if (!arquivo) return;

        const ext = obterExtensao(arquivo.name);
        const temPreview = TIPOS_IMAGEM.has(ext);

        setArtes(prev => ({
            ...prev,
            [modeloId]: { file: arquivo, nome: arquivo.name, preview: null, temPreview }
        }));

        if (temPreview) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setArtes(prev => ({
                    ...prev,
                    [modeloId]: { ...prev[modeloId], preview: ev.target.result }
                }));
            };
            reader.readAsDataURL(arquivo);
        }
    }

    function removerArte(modeloId) {
        setArtes(prev => {
            const novo = { ...prev };
            delete novo[modeloId];
            return novo;
        });
    }

    function handleContinuar() {
        const selecionadosModelos = MODELOS.filter(m => modelos[m.id].selecionado);

        if (selecionadosModelos.length === 0) {
            alert('Selecione pelo menos um produto.');
            return;
        }

        const selecionados = selecionadosModelos.map(m => {
            const d = modelos[m.id];
            const grade = Object.fromEntries(
                Object.entries(d.quantidades).filter(([, v]) => v > 0)
            );
            const itens = estoquesPorModelo[m.id] || [];
            const estoqueId = estoqueIds[m.id] || (itens.length === 1 ? itens[0].id : null);
            return {
                item: m.label,
                grade,
                estoque_id: estoqueId,
                detalhes: {
                    tecido:         d.tecido,
                    cor:            d.cor,
                    personalizacao: d.personalizacao,
                    local:          d.local,
                    observacao:     d.observacao,
                },
            };
        });

        const semQtd = selecionados.filter(p => Object.keys(p.grade).length === 0);
        if (semQtd.length > 0) {
            alert(`Preencha as quantidades de: ${semQtd.map(p => p.item).join(', ')}`);
            return;
        }

        const semDetalhe = selecionados.filter(p =>
            !p.detalhes.tecido || !p.detalhes.cor || !p.detalhes.local
        );
        if (semDetalhe.length > 0) {
            alert(`Preencha Tecido, Cor e Local da Arte de: ${semDetalhe.map(p => p.item).join(', ')}`);
            return;
        }

        // File objects passados via state do router (não serializados em localStorage)
        const artesOrdenadas = selecionadosModelos.map(m => artes[m.id]?.file || null);

        localStorage.setItem('detalhesPedido', JSON.stringify({ produtos: selecionados }));
        navigate('/pedidos/novo/ficha', { state: { artesOrdenadas } });
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
                            Configure cor, tecido, técnica e local da arte de cada item. Depois defina as quantidades e adicione a arte.
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
                            Configure cada modelo — técnica, tecido, cor e local da arte. Clique em "Selecionar" para definir
                            quantidades e adicionar a arte individual.
                        </p>

                        <div className="modelos-grid">
                            {MODELOS.map(m => (
                                <ModeloCard
                                    key={m.id}
                                    modelo={m}
                                    dados={modelos[m.id]}
                                    arte={artes[m.id]}
                                    selecionado={modelos[m.id].selecionado}
                                    onChange={(campo, valor) => handleChange(m.id, campo, valor)}
                                    onArte={arquivo => handleArte(m.id, arquivo)}
                                    onRemoverArte={() => removerArte(m.id)}
                                    onToggle={() => handleToggle(m.id)}
                                    estoqueItens={estoquesPorModelo[m.id] || []}
                                    estoqueId={estoqueIds[m.id] || null}
                                    onEstoqueChange={id => setEstoqueIds(prev => ({ ...prev, [m.id]: id }))}
                                />
                            ))}
                        </div>
                    </section>

                    <div className="form-actions">
                        <button type="button" className="btn-page-sec" onClick={() => navigate('/pedidos/novo')}>
                            Voltar
                        </button>
                        <button type="button" className="btn btn-add" onClick={handleContinuar}>
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
