import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";
import "../styles/padrao.css";
import "../styles/ficha-tecnica.css";

function VisualizarItem() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get(`/pedidos/itens/${id}`)
            .then(res => setItem(res.data))
            .catch(e => setErro(e.message || 'Erro ao carregar item.'));
    }, [id]);

    if (erro) {
        return (
            <>
                <Sidebar />
                <div className="container">
                    <div className="form-page-card" style={{ textAlign: 'center', padding: 40 }}>
                        <p style={{ color: '#991b1b' }}>{erro}</p>
                        <button className="btn-page-sec" onClick={() => navigate(-1)}>Voltar</button>
                    </div>
                </div>
            </>
        );
    }

    if (!item) {
        return (
            <>
                <Sidebar />
                <div className="container">
                    <div className="form-page-card" style={{ textAlign: 'center', padding: 40 }}>
                        <p>Carregando...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Sidebar />
            <div className="container">
                <div className="form-page-card">

                    <div className="form-header">
                        <span className="form-badge">
                            <span className="material-icons">qr_code_scanner</span>
                            Pedido #{item.numero_pedido}
                        </span>
                        <h1 className="form-title">{item.nome_produto}</h1>
                        <p className="form-subtitle">Visualização do item de produção.</p>
                    </div>

                    <div className="fc-item-layout" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 0' }}>

                        {/* Foto de referência do estoque */}
                        <div className="fc-item-foto" style={{ minWidth: 160, textAlign: 'center' }}>
                            {item.foto_estoque_url ? (
                                <img
                                    src={item.foto_estoque_url}
                                    alt="Foto de referência"
                                    style={{ maxWidth: 160, maxHeight: 200, objectFit: 'contain',
                                             borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                            ) : (
                                <div style={{ width: 120, height: 120, background: '#f3f4f6',
                                              borderRadius: 8, display: 'flex', alignItems: 'center',
                                              justifyContent: 'center', margin: '0 auto' }}>
                                    <span className="material-icons" style={{ fontSize: 48, color: '#9ca3af' }}>
                                        checkroom
                                    </span>
                                </div>
                            )}
                            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Foto de referência</p>
                        </div>

                        {/* Dados de produção */}
                        <div className="fc-item-dados" style={{ flex: 1, minWidth: 200 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <tbody>
                                    {[
                                        ['Produto',         item.nome_produto],
                                        ['Tecido',          item.tecido],
                                        ['Cor',             item.cor],
                                        ['Personalização',  item.personalizacao || '—'],
                                        ['Local da Arte',   item.local_arte],
                                    ].map(([label, val]) => (
                                        <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 600, color: '#374151',
                                                         width: '40%', whiteSpace: 'nowrap' }}>{label}</td>
                                            <td style={{ padding: '8px 4px', color: '#111827' }}>{val}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {item.tamanhos?.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Quantidades</p>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {item.tamanhos.map(t => (
                                            <span key={t.tamanho} style={{ background: '#f3f4f6', borderRadius: 6,
                                                                            padding: '4px 10px', fontSize: 13 }}>
                                                {t.tamanho}: <strong>{t.quantidade}</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {item.observacao && (
                                <p style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                                    <strong>Obs.:</strong> {item.observacao}
                                </p>
                            )}

                            {item.arte_url && (
                                <div style={{ marginTop: 16 }}>
                                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Arte do Cliente</p>
                                    <img
                                        src={item.arte_url}
                                        alt="Arte do cliente"
                                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain',
                                                 borderRadius: 8, border: '1px solid #e5e7eb' }}
                                    />
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="form-actions no-print">
                        <button className="btn-page-sec" onClick={() => navigate(-1)}>Voltar</button>
                        <button className="btn btn-add" onClick={() => window.print()}>
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>print</span>
                            Imprimir
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}

export default VisualizarItem;
