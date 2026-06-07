import Modal from "../components/Modal"
import Sidebar from "../components/Sidebar"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import '../styles/padrao.css'
import '../styles/cliente.css'

function Clientes() {

    const navigate = useNavigate();
    const [modalAberto, setModalAberto] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [clientes, setClientes] = useState([]);

    // Busca os clientes do banco ao carregar a página
    useEffect(() => {
        fetch('http://localhost:5000/listar-clientes')
            .then(res => res.json())
            .then(dados => setClientes(dados))
    }, [])

    function abrirCliente(cliente) {
        setClienteSelecionado(cliente)
        setModalAberto(true)
    }

    return (
        <>
            <Sidebar />

            <div className="container">

                {/* TOPO */}
                <div className="top">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">Clientes Cadastrados</h1>
                            <span className="page-count">({clientes.length})</span>
                        </div>
                        <p className="page-subtitle">
                            Gerenciamento de clientes cadastrados no sistema
                        </p>
                    </div>

                    <div className="top-right">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>
                            <input className="search" placeholder="Pesquisar cliente" />
                        </div>

                        <select className="btn btn-filter">
                            <option>Todos</option>
                        </select>

                        <button className="btn btn-add" onClick={() => navigate('/formCliente')}>
                            + Cliente
                        </button>
                    </div>
                </div>

                <div className="list">
                    <div className="clients-grid">

                        {clientes.map((cliente, index) => (
                            <div
                                key={index}
                                className="client-card"
                                onClick={() => abrirCliente(cliente)}
                            >
                                <div className="client-logo">
                                    {cliente[11] && (
                                        <img
                                            src={`http://localhost:5000/static/uploads/${cliente[11]}`}
                                            alt="logo"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    )}
                                </div>
                                <div className="client-footer">
                                    <span className="client-name">{cliente[0]}</span>
                                    <div className={`status-dot ${cliente[12] ? 'ativo' : 'inativo'}`}></div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                <Modal aberto={modalAberto} onClose={() => setModalAberto(false)}>

                    <div className="modal-header">
                        <div className="modal-title-group">
                            <h2 className="modal-title">{clienteSelecionado?.[0]}</h2>
                            <p className="modal-subtitle">Cliente cadastrado</p>
                        </div>
                    </div>

                    <div className="modal-body">
                        <div className="modal-info">
                            <span className="modal-label">Responsável</span>
                            <p className="modal-value">{clienteSelecionado?.[1]}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">Telefone</span>
                            <p className="modal-value">{clienteSelecionado?.[3]}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">E-mail</span>
                            <p className="modal-value">{clienteSelecionado?.[4]}</p>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-sec" onClick={() => setModalAberto(false)}>
                            Fechar
                        </button>
                        <button 
                        className="btn btn-add" 
                        onClick={() => {
                            setModalAberto(false)
                            navigate('/formCliente', { state: clienteSelecionado })
                        }}>
                            Editar
                        </button>
                    </div>

                </Modal>
            </div>
        </>
    );
}

export default Clientes