import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FotoProdutoEstoque from "../components/FotoProdutoEstoque";
import SelectTecidoCor from "../components/SelectTecidoCor";
import { useTecidosEstoque } from "../hooks/useTecidosEstoque";
import { nomeTecidoCor } from "../utils/tecidosEstoque";
import SelectOpcoes from "../components/SelectOpcoes";
import {
    TAMANHOS, PERSONALIZACOES, LOCAIS,
} from "../utils/opcoesProduto";
import { avisoSaldo } from "../utils/produtosEstoque";
import { api } from "../services/api";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/Novopedido.css";

const TIPOS_IMAGEM = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

function obterExtensao(nome) {
    return (nome || '').split('.').pop().toLowerCase();
}

// Card individual de produto com arte própria
function ModeloCard({ modelo, dados, arte, onChange, onArte, onRemoverArte, selecionado, onToggle, tecidosEstoque, onTecidoChange }) {
    const semEstoque = Number(modelo.quantidade_atual) <= 0;
    return (
        <fieldset disabled={semEstoque} className={`modelo-card produto-estoque-card ${selecionado ? 'selecionado' : ''}`}>

            {/* FRENTE — configuração */}
            {!selecionado && (
                <div className="modelo-frente">
                    <FotoProdutoEstoque estoqueId={modelo.id} nome={modelo.label} temImagem={!!modelo.tem_imagem} />

                    <h3 className="modelo-nome">{modelo.label}{avisoSaldo(modelo)}</h3>

                    <div className="modelo-selects">
                        <SelectOpcoes
                            label="Personalização"
                            groups={PERSONALIZACOES}
                            value={dados.personalizacao}
                            onChange={e => onChange('personalizacao', e.target.value)}
                        />
                        <SelectTecidoCor {...tecidosEstoque} detalhes={dados} onChange={onTecidoChange} />
                        <SelectOpcoes
                            label="Local da Arte"
                            groups={LOCAIS}
                            value={dados.local}
                            onChange={e => onChange('local', e.target.value)}
                        />

                    </div>

                    <button type="button" className="btn btn-add modelo-btn" onClick={onToggle}>
                        Selecionar
                    </button>
                </div>
            )}

            {/* VERSO — quantidades + arte */}
            {selecionado && (
                <div className="modelo-verso">
                    <h3 className="modelo-nome">{modelo.label}{avisoSaldo(modelo)}</h3>

                    <p className="section-help" style={{ marginBottom: 16 }}>
                        {nomeTecidoCor(dados) && <span className="tag-detalhe">{nomeTecidoCor(dados)}</span>}
                        {dados.personalizacao && <span className="tag-detalhe">{dados.personalizacao}</span>}
                        {dados.local && (
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



                    {/* Arte individual deste produto */}
                    <div className="arte-produto">
                        <p className="arte-produto-titulo">
                            <span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>image</span>
                            Arte do Cliente
                        </p>

                        {(arte?.file || arte?.logoCliente) && (
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
                            {arte?.file || arte?.logoCliente ? 'Trocar arte' : 'Escolher arte'}
                            <input
                                id={`arte-${modelo.id}`}
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf,.ai,image/*"
                                style={{ display: 'none' }}
                                onChange={e => onArte(e.target.files[0])}
                            />
                        </label>

                        {(arte?.file || arte?.logoCliente) && (
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

        </fieldset>
    );
}

function SelecionarProdutos() {
    const navigate = useNavigate();
    const tecidosEstoque = useTecidosEstoque();

    const [produtosEstoque, setProdutosEstoque] = useState([]);
    const [modelos, setModelos] = useState({});
    const [carregando, setCarregando] = useState(true);
    const [erroProdutos, setErroProdutos] = useState('');
    const [artes, setArtes] = useState({});

    useEffect(() => {
        let ativo = true;
        api.get('/estoque/produtos-pedido', { lista: true })
            .then(produtos => {
                if (!ativo) return;
                const lista = produtos.map(p => ({ ...p, label: p.nome }));
                setProdutosEstoque(lista);
                setModelos(Object.fromEntries(lista.map(p => [p.id, {
                    personalizacao: '', tecido: '', cor: '', material_id: null, material_cor_id: null, local: '',
                    quantidades: {}, selecionado: false,
                }])));
            })
            .catch(erro => { if (ativo) setErroProdutos(erro.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
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
        if (Number(produtosEstoque.find(p => p.id === modeloId)?.quantidade_atual) <= 0) return;
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
        const selecionadosModelos = produtosEstoque.filter(m => modelos[m.id]?.selecionado);

        if (selecionadosModelos.length === 0) {
            alert('Selecione pelo menos um produto.');
            return;
        }

        const selecionados = selecionadosModelos.map(m => {
            const d = modelos[m.id];
            const grade = Object.fromEntries(
                Object.entries(d.quantidades).filter(([, v]) => v > 0)
            );
            return {
                item: m.label,
                grade,
                estoque_id: m.id,
                detalhes: {
                    tipo_produto_id: null,
                    material_id: d.material_id,
                    material_cor_id: d.material_cor_id,
                    tecido: d.tecido,
                    cor: d.cor,
                    personalizacao: d.personalizacao,
                    local: d.local,
                },
            };
        });

        const semQtd = selecionados.filter(p => Object.keys(p.grade).length === 0);
        if (semQtd.length > 0) {
            alert(`Preencha as quantidades de: ${semQtd.map(p => p.item).join(', ')}`);
            return;
        }

        const semDetalhe = selecionados.filter(p =>
            !p.detalhes.material_id || !p.detalhes.material_cor_id || !p.detalhes.local
        );
        if (semDetalhe.length > 0) {
            alert(`Preencha Tecido, Cor e Local da Arte de: ${semDetalhe.map(p => p.item).join(', ')}`);
            return;
        }

        // File objects passados via state do router (não serializados em localStorage)
        const artesOrdenadas = selecionadosModelos.map(m => {
            const arte = artes[m.id];
            return arte?.file || (arte?.logoCliente ? { logoCliente: arte.logoCliente } : null);
        });

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
                        <h2>Produtos disponíveis</h2>
                        <p className="section-help">
                            Configure cada produto — técnica, tecido, cor e local da arte. Clique em "Selecionar" para definir
                            quantidades e adicionar a arte individual.
                        </p>

                        {carregando && <p role="status">Carregando produtos...</p>}
                        {erroProdutos && <p role="alert">{erroProdutos}</p>}
                        {!carregando && !erroProdutos && produtosEstoque.length === 0 && (
                            <p className="section-help">
                                Nenhum produto cadastrado no estoque. <Link to="/add-estoque">Adicionar Itens</Link>
                            </p>
                        )}
                        <div className="modelos-grid">
                            {produtosEstoque.map(m => (
                                <ModeloCard
                                    key={m.id}
                                    modelo={m}
                                    tecidosEstoque={tecidosEstoque}
                                    onTecidoChange={detalhes => setModelos(prev => ({
                                        ...prev, [m.id]: { ...prev[m.id], ...detalhes },
                                    }))}
                                    dados={modelos[m.id]}
                                    arte={artes[m.id]}
                                    selecionado={modelos[m.id].selecionado}
                                    onChange={(campo, valor) => handleChange(m.id, campo, valor)}
                                    onArte={arquivo => handleArte(m.id, arquivo)}
                                    onRemoverArte={() => removerArte(m.id)}
                                    onToggle={() => handleToggle(m.id)}
                                />
                            ))}
                        </div>
                    </section>

                    <div className="form-actions">
                        <button type="button" className="btn-page-sec" onClick={() => navigate('/pedidos/novo')}>
                            Voltar
                        </button>
                        <button type="button" className="btn btn-add" disabled={carregando || !!erroProdutos || !produtosEstoque.length} onClick={handleContinuar}>
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
