import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FichaConteudo from "../components/FichaConteudo";
import { buscarPedido } from "../services/pedidosService";
import "../styles/padrao.css";
import "../styles/formulario.css";

function VisualizarPedido() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState('');

    useEffect(() => {
        buscarPedido(id)
            .then(setDados)
            .catch(e => setErro(e.message || 'Não foi possível carregar o pedido.'));
    }, [id]);

    if (erro) {
        return (
            <>
                <Sidebar />
                <div className="container">
                    <div className="form-page-card">
                        <p style={{ color: '#ef4444', textAlign: 'center', padding: '40px 0' }}>
                            {erro}
                        </p>
                        <div className="form-actions">
                            <button className="btn-page-sec" onClick={() => navigate('/pedidos')}>
                                Voltar para Pedidos
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!dados) {
        return (
            <>
                <Sidebar />
                <div className="container">
                    <div className="form-page-card">
                        <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                            Carregando pedido...
                        </p>
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
                    <div className="form-header no-print">
                        <h1 className="form-title">Pedido #{dados.numero_pedido}</h1>
                    </div>

                    <FichaConteudo
                        pedido={dados.pedido}
                        ficha={dados.ficha}
                        pedidoId={dados.id}
                    />

                    <div className="form-actions no-print">
                        <button className="btn-page-sec" onClick={() => navigate('/pedidos')}>
                            Voltar
                        </button>
                        <button className="btn-page-sec" onClick={() => window.print()}>
                            <span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>print</span>
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default VisualizarPedido;
