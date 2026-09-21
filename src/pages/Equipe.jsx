import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import '../styles/equipe.css';
import '../styles/padrao.css';

function Equipe() {
    const usuarios = []; // futuramente virá do backend via axios
    const navigate = useNavigate();
    const administradorPrincipalId = null;

    return (
        <div className="equipe-container">
            <Sidebar />

            <main className="equipe-conteudo">

<div className="top">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">Colaboradores</h1>
                            <span className="page-count">(2)</span>
                        </div>
                        <p className="page-subtitle">
                            Gerenciamento de membros da equipe
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

                        <button className="btn btn-add" onClick={() => navigate('/formUsuario')}>
                            + Colaborador
                        </button>
                    </div>
                </div>

                <div className="equipe-grid">

                    {/* Tabela de usuários */}
                    <div className="equipe-card">
                        <div className="equipe-card-header">
                            <div>
                                <h3>Usuários vinculados</h3>
                                <small>Ativos: {usuarios.filter(u => u.ativo).length} / Sem limite</small>
                            </div>
                            <span className="equipe-badge">
                                {usuarios.length}/∞
                            </span>
                        </div>

                        <table className="equipe-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Usuário</th>
                                    <th>Perfil</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="equipe-vazio">
                                                Nenhum usuário vinculado.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    usuarios.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                {item.nome}
                                                {administradorPrincipalId === item.id && (
                                                    <div className="equipe-admin-label">
                                                        Administrador principal
                                                    </div>
                                                )}
                                            </td>
                                            <td>{item.username}</td>
                                            <td>
                                                <select
                                                    className="equipe-select"
                                                    defaultValue={item.perfil}
                                                    disabled={administradorPrincipalId === item.id}
                                                >
                                                    <option value="ADMIN">Administrador</option>
                                                    <option value="GERENTE">Gerente</option>
                                                    <option value="ATENDENTE">Atendente</option>
                                                    <option value="MECANICO">Operador</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`equipe-status ${item.ativo ? "ativo" : "inativo"}`}>
                                                    {item.ativo ? "Ativo" : "Inativo"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="equipe-acoes">
                                                    <button
                                                        className="btn-salvar"
                                                        disabled={administradorPrincipalId === item.id}
                                                        onClick={() => {
                                                            // futuramente: axios para salvar perfil
                                                        }}
                                                    >
                                                        Salvar
                                                    </button>
                                                    {administradorPrincipalId === item.id ? (
                                                        <button className="btn-protegido" disabled>
                                                            Protegido
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn-excluir"
                                                            onClick={() => {
                                                                if (confirm("Deseja excluir este usuário?")) {
                                                                    // futuramente: axios para deletar
                                                                }
                                                            }}
                                                        >
                                                            Excluir
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Formulário de adicionar usuário */}
                    {/* <div className="equipe-card equipe-form">
                        <h3>Adicionar usuário</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            // futuramente: axios para salvar novo usuário
                        }}>
                            <div className="equipe-campo">
                                <label>Nome</label>
                                <input type="text" placeholder="Nome completo" />
                            </div>
                            <div className="equipe-campo">
                                <label>Username</label>
                                <input type="text" placeholder="Username" />
                            </div>
                            <div className="equipe-campo">
                                <label>Email</label>
                                <input type="email" placeholder="Email" />
                            </div>
                            <div className="equipe-campo">
                                <label>Senha</label>
                                <input type="password" placeholder="Senha" />
                            </div>
                            <div className="equipe-campo">
                                <label>Perfil</label>
                                <select>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="GERENTE">Gerente</option>
                                    <option value="ATENDENTE">Atendente</option>
                                    <option value="MECANICO">Operador</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-salvar-usuario">
                                Salvar usuário
                            </button>
                        </form>
                    </div> */}

                </div>
            </main>
        </div>
    );
}

export default Equipe;