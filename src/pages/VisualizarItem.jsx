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

                    <div className="fc-item-layout" style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>

                        {/* A peça: produto + arte aplicada pelo cliente */}
                        <div className="fc-item-arte" style={{ textAlign: 'center', maxWidth: 420 }}>
                            {item.arte_url ? (
                                <img
                                    src={item.arte_url}
                                    alt={`Arte de ${item.nome_produto}`}
                                    style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain',
                                             borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                            ) : (
                                <div style={{ width: 240, height: 240, background: '#f3f4f6',
                                              borderRadius: 8, display: 'flex', alignItems: 'center',
                                              justifyContent: 'center', margin: '0 auto' }}>
                                    <span className="material-icons" style={{ fontSize: 64, color: '#9ca3af' }}>
                                        checkroom
                                    </span>
                                </div>
                            )}
                            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                                {item.arte_url ? 'Arte enviada pelo cliente' : 'Nenhuma arte enviada para este item'}
                            </p>
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
