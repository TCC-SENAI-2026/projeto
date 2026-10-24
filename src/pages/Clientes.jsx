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
    const [filtroStatus, setFiltroStatus] = useState('Todos');

    // Busca os clientes do banco ao carregar a página
    useEffect(() => {
        // TODO (BACK): /listar-clientes precisa
        // 1) retornar ativos E inativos (hoje tem WHERE ativo = 1), senão o filtro "Inativos" fica vazio;
        // 2) incluir o id do cliente (necessário para /editar-cliente/<id>);
        // 3) seguir a ordem de colunas que o front lê: 0 nome, 1 responsavel, 2 cpf_cnpj,
        //    3 telefone, 4 email, 5 cep, 6 rua, 7 numero, 8 municipio, 9 estado,
        //    10 observacoes, 11 foto_logo, 12 ativo (ou retornar objetos).
        api.get('/listar-clientes', { lista: true })
            .then(dados => setClientes(Array.isArray(dados) ? dados : []))
            .catch(erro => {
                if (erro.status === 401) navigate('/login'); // troque pela rota real da sua tela de login
                console.log('Erro ao carregar clientes:', erro);
                setClientes([]);
            });
    }, [])

    // TODO (BACK): incluir o id do cliente na resposta de /listar-clientes,
    // necessário para chamar /editar-cliente/<id_cliente>.
    function abrirCliente(cliente) {
        setClienteSelecionado(cliente)
        setModalAberto(true)
    }

    // TODO (BACK): o filtro de busca e de status roda aqui no front, sobre a lista
    // completa. Se a quantidade de clientes crescer, mover para o back
    // (ex.: ?busca=...&status=...) com paginação.
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
                                        <h2 className="modal-title">
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

                            <div className="modal-body">

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
                                    className="btn-sec"
                                    onClick={() => setModalAberto(false)}
                                >
                                    Fechar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-add"
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

                            </div>
                        </>
                    )}
                </Modal>
            </div>
        </>
    );
}

export default Clientes