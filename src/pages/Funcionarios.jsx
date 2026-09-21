import Modal from "../components/Modal";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/padrao.css'
import '../styles/funcionario.css'

function Funcioanrios() {

    const navigate = useNavigate();
    const [modalAberto, setModalAberto] = useState(false);
    const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

    function abrirFuncionario(funcionario) {
        setFuncionarioSelecionado(funcionario)
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
                            <h1 className="page-title">Funcionários Cadastrados</h1>
                            <span className="page-count">(2)</span>
                        </div>
                        <p className="page-subtitle">
                            Gerenciamento de funcionários cadastrados no sistema
                        </p>
                    </div>

                    <div className="top-right">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>
                            <input className="search" placeholder="Pesquisar funcionário" />
                        </div>

                        <select className="btn btn-filter">
                            <option>Todos</option>
                        </select>

                        <button className="btn btn-add" 
                                onClick={() => navigate('/formFuncionario')}
                        >
                            + Funcionário
                        </button>
                    </div>
                </div>

                <div className="list">
                    <div className="funcionario-grid">

                        {/* FUNCIONARIO 1 */}
                        <div className="funcionario-card"
                            onClick={() =>
                                abrirFuncionario({
                                    nome: 'João Silva',
                                    setor: 'Produção',
                                    telefone: '(14)99999-9999',
                                    email: 'joao@email.com',
                                    escala: 'Turno manhã',
                                    registro: 'Admissão 02/03/2026'
                                })
                            }
                        >
                            <div className="funcionario-logo"></div>
                            <div className="funcionario-footer">
                                <span className="funcionario-name">João Silva</span>
                                <div className="status-dot"></div>
                            </div>
                        </div>

                        {/* FUNCIONARIO 2 */}
                        <div className="funcionario-card"
                            onClick={() =>
                                abrirFuncionario({
                                    nome: 'Maria Souza',
                                    setor: 'Administração',
                                    telefone: '(11)98888-8888',
                                    email: 'maria@email.com',
                                    escala: 'Turno integral',
                                    registro: 'Admissão 10/03/2026'
                                })
                            }
                        >
                            <div className="funcionario-logo"></div>
                            <div className="funcionario-footer">
                                <span className="funcionario-name">Maria Souza</span>
                                <div className="status-dot"></div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* MODAL */}
                <Modal aberto={modalAberto} onClose={() => setModalAberto(false)}>

                    <div className="modal-header">
                        <div className="modal-title-group">
                            <h2 className="modal-title">{funcionarioSelecionado?.nome}</h2>
                            <p className="modal-subtitle">Funcionário cadastrado</p>
                        </div>
                    </div>

                    <div className="modal-body">
                        <div className="modal-info">
                            <span className="modal-label">Setor</span>
                            <p className="modal-value">{funcionarioSelecionado?.setor}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">Telefone</span>
                            <p className="modal-value">{funcionarioSelecionado?.telefone}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">E-mail</span>
                            <p className="modal-value">{funcionarioSelecionado?.email}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">Escala</span>
                            <p className="modal-value">{funcionarioSelecionado?.escala}</p>
                        </div>

                        <div className="modal-info">
                            <span className="modal-label">Último registro</span>
                            <p className="modal-value">{funcionarioSelecionado?.registro}</p>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn-sec"
                            onClick={() => setModalAberto(false)}
                        >
                            Fechar
                        </button>

                        <button
                            className="btn btn-add"
                            onClick={() => alert('Editar funcionário')}
                            //onClick={() => navigate('/formFuncionario', { state: { funcionario: funcionarioSelecionado } })}
                        >
                            Editar
                        </button>
                    </div>

                </Modal>

            </div>
        </>
    );
}
export default Funcioanrios
