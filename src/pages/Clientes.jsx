import Modal from "../components/Modal"
import Sidebar from "../components/Sidebar"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import '../styles/padrao.css'
import '../styles/cliente.css'
import { api } from "../services/api";

function Clientes() {

    const navigate = useNavigate();
    const [modalAberto, setModalAberto] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Ativos');

    // A API retorna clientes ativos e inativos; o status é filtrado nesta tela.
    useEffect(() => {
        api.get('/listar-clientes', { lista: true })
            .then(dados => setClientes(Array.isArray(dados) ? dados : []))
            .catch(erro => {
                if (erro.status === 401) navigate('/login'); // troque pela rota real da sua tela de login
                console.log('Erro ao carregar clientes:', erro);
                setClientes([]);
            });
    }, [])

    function abrirCliente(cliente) {
        setClienteSelecionado(cliente)
        setModalAberto(true)
    }

    // Aplica busca e status sobre os registros recebidos da API.
    const clientesFiltrados = clientes.filter(cliente => {
        const termo = busca.trim().toLowerCase();
        const nome = String(cliente[0] ?? '').toLowerCase();

        const bateBusca = nome.includes(termo);
        const bateStatus =
            filtroStatus === 'Todos' ||
            (filtroStatus === 'Ativos' && cliente[12]) ||
            (filtroStatus === 'Inativos' && !cliente[12]);

        return bateBusca && bateStatus;
    });

    return (
        <>
            <Sidebar />

            <div className="container">

                {/* TOPO */}
                <div className="top">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">Clientes Cadastrados</h1>
                            <span className="page-count">({clientesFiltrados.length})</span>
                        </div>
                        <p className="page-subtitle">
                            Gerenciamento de clientes cadastrados no sistema
                        </p>
                    </div>

                    <div className="top-right">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>
                            <input
                                className="search"
                                placeholder="Pesquisar cliente"
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                            />
                        </div>

                        <select
                            className="btn btn-filter"
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value)}
                        >
                            <option>Todos</option>
                            <option>Ativos</option>
                            <option>Inativos</option>
                        </select>

                        <button className="btn btn-add" onClick={() => navigate('/formCliente')}>
                            + Cliente
                        </button>
                    </div>
                </div>

                <div className="list">
                    <div className="clients-grid">

                        {clientesFiltrados.map((cliente, index) => (
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

                <Modal
                    aberto={modalAberto}
                    onClose={() => setModalAberto(false)}
                    className="cliente-detalhes-modal"
                    tituloId="cliente-modal-titulo"
                >
                    {clienteSelecionado && (
                        <>
                            <div className="modal-header cliente-modal-header">

                                <div className="cliente-modal-identidade">

                                    <div className="cliente-modal-logo">
                                        {clienteSelecionado[11] ? (
                                            <img
                                                src={`http://localhost:5000/static/uploads/${clienteSelecionado[11]}`}
                                                alt=""
                                            />
                                        ) : (
                                            <span className="material-icons">
                                                business
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="modal-title" id="cliente-modal-titulo">
                                            {clienteSelecionado[0]}
                                        </h2>

                                        <p className="modal-subtitle">
                                            Informações do cliente
                                        </p>
                                    </div>

                                </div>

                                <span
                                    className={`cliente-status ${clienteSelecionado[12] ? "ativo" : "inativo"
                                        }`}
                                >
                                    <span className="status-dot"></span>

                                    {clienteSelecionado[12] ? "Ativo" : "Inativo"}
                                </span>

                            </div>

                            <div className="modal-body cliente-detalhes-body">

                                <div className="cliente-info-section">

                                    <h3>Informações de contato</h3>

                                    <div className="cliente-info-grid">

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                Responsável
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[1] || "Não informado"}
                                            </p>
                                        </div>

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                CPF / CNPJ
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[2] || "Não informado"}
                                            </p>
                                        </div>

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                Telefone
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[3] || "Não informado"}
                                            </p>
                                        </div>

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                E-mail
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[4] || "Não informado"}
                                            </p>
                                        </div>

                                    </div>

                                </div>


                                <div className="cliente-info-section">

                                    <h3>Endereço</h3>

                                    <div className="cliente-info-grid">

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                CEP
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[5] || "Não informado"}
                                            </p>
                                        </div>

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                Município
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[8] || "Não informado"}
                                            </p>
                                        </div>

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                Estado
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[9] || "Não informado"}
                                            </p>
                                        </div>

                                        <div className="modal-info">
                                            <span className="modal-label">
                                                Rua e número
                                            </span>

                                            <p className="modal-value">
                                                {clienteSelecionado[6]
                                                    ? `${clienteSelecionado[6]}, ${clienteSelecionado[7] || "s/n"}`
                                                    : "Não informado"
                                                }
                                            </p>
                                        </div>

                                    </div>

                                </div>


                                {clienteSelecionado[10] && (
                                    <div className="cliente-info-section">

                                        <h3>Observações</h3>

                                        <p className="cliente-observacoes">
                                            {clienteSelecionado[10]}
                                        </p>

                                    </div>
                                )}

                            </div>


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-sec cliente-acao-editar"
                                    onClick={() => {
                                        setModalAberto(false);

                                        navigate("/formCliente", {
                                            state: clienteSelecionado
                                        });
                                    }}
                                >
                                    <span className="material-icons">
                                        edit
                                    </span>

                                    Editar cliente
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-add cliente-acao-novo"
                                    onClick={() => {
                                        setModalAberto(false);
                                        navigate("/pedidos/novo", {
                                            state: {
                                                cliente: {
                                                    nomeCliente: clienteSelecionado[0] || "",
                                                    contato: clienteSelecionado[3] || "",
                                                    email: clienteSelecionado[4] || "",
                                                    logo: clienteSelecionado[11] || "",
                                                },
                                            },
                                        });
                                    }}
                                >
                                    <span className="material-icons">add_shopping_cart</span>
                                    Novo pedido
                                </button>

                            </div>
                        </>
                    )}
                </Modal>
            </div>
        </>
    );
}

export default Clientes
