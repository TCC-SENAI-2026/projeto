import Modal from "../components/Modal"
import Sidebar from "../components/Sidebar"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import '../styles/padrao.css'
import '../styles/cliente.css'


function Clientes() {

    const navigate = useNavigate();
    const [modalAberto, setModalAberto] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);

    function abrirCliente(cliente) {
        console.log('clicou', cliente);
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
                            <span className="page-count">(2)</span>
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

                        {/* CLIENTE 1 */}
                        <div className="client-card"
                            onClick={() =>
                                abrirCliente({
                                    empresa: 'Caio Induscar',
                                    responsavel: 'Joao Silva',
                                    telefone: '(14)99999-9999',
                                    email: 'empresa@email.com',
                                    pedidos: '12 pedidos',
                                    ultimoPedido: '02/03/2026'
                                })
                            }
                        >
                            <div className="client-logo"></div>
                            <div className="client-footer">
                                <span className="client-name">Caio Induscar</span>
                                <div className="status-dot"></div>
                            </div>
                        </div>


                        {/* CLIENTE 2 */}
                        <div className="client-card"
                            onClick={() =>
                                abrirCliente({
                                    empresa: 'Irizar',
                                    responsavel: 'Maria Souza',
                                    telefone: '(14)99999-9999',
                                    email: 'beta@email.com',
                                    pedidos: '5 pedidos',
                                    ultimoPedido: '10/03/2026'
                                })
                            }
                        >
                            <div className="client-logo"></div>
                            <div className="client-footer">
                                <span className="client-name">Irizar</span>
                                <div className="status-dot"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <Modal aberto={modalAberto} onClose={() => setModalAberto(false)}>

                    <div className="modal-header">
                        <div className="modal-title-group">
                            <h2 className="modal-title">{clienteSelecionado?.empresa}</h2>
                            <p className="modal-subtitle">Cliente cadastrado</p>
                        </div>
                    </div>

                    <div className="modal-body">
                        <div className="modal-info">
                            <span className="modal-label">Responsável</span>
                            <p className="modal-value">{clienteSelecionado?.responsavel}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">Telefone</span>
                            <p className="modal-value">{clienteSelecionado?.telefone}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">E-mail</span>
                            <p className="modal-value">{clienteSelecionado?.email}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">Pedidos</span>
                            <p className="modal-value">{clienteSelecionado?.pedidos}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">Último pedido</span>
                            <p className="modal-value">{clienteSelecionado?.ultimoPedido}</p>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-sec" onClick={() => setModalAberto(false)}>
                            Fechar
                        </button>

                        <button 
                            className="btn btn-add" 
                            onClick={() => alert('Editar')}
                            //onCick={() => navigate('/formCliente', { state: clienteSelecionado })} 
                        >
                            Editar
                        </button>
                    </div>

                </Modal>
            </div>
        </>
    );
}
export default Clientes
