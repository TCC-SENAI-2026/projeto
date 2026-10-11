import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import '../styles/Equipe.css';
import '../styles/padrao.css';

const API_URL = "http://localhost:5000";

const NIVEIS = {
    administrativo: "Administrativo",
    padrao: "Padrão"
};

function Equipe() {
    const navigate = useNavigate();

    const [usuarios, setUsuarios] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [busca, setBusca] = useState("");

    useEffect(() => {
        async function carregarColaboradores() {
            try {
                const { data } = await axios.get(`${API_URL}/listar-colaboradores`);

                // Formato antigo do back (lista de valores, sem nome de campo): o Flask não foi reiniciado
                if (!Array.isArray(data) || data.some((d) => Array.isArray(d))) {
                    setErro("O servidor respondeu no formato antigo. Reinicie o Flask com o colaboradores.py atualizado.");
                    return;
                }

                setUsuarios(data);
            } catch {
                setErro("Não foi possível carregar os colaboradores. O servidor está rodando?");
            } finally {
                setCarregando(false);
            }
        }
        carregarColaboradores();
    }, []);

    const termo = busca.trim().toLowerCase();
    const filtrados = usuarios.filter((u) =>
        !termo ||
        [u.nome_completo, u.re, u.email].some((v) => v && v.toLowerCase().includes(termo))
    );

    return (
        <div className="equipe-container">
            <Sidebar />

            <main className="equipe-conteudo">

                <div className="top">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">Colaboradores</h1>
                            <span className="page-count">({usuarios.length})</span>
                        </div>
                        <p className="page-subtitle">
                            Gerenciamento de membros da equipe
                        </p>
                    </div>

                    <div className="top-right">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>
                            <input
                                className="search"
                                placeholder="Pesquisar colaborador"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
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
                                    <th>RE</th>
                                    <th>Nível de acesso</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carregando || erro || filtrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="equipe-vazio">
                                                {carregando
                                                    ? "Carregando colaboradores..."
                                                    : erro
                                                        ? erro
                                                        : usuarios.length === 0
                                                            ? "Nenhum usuário vinculado."
                                                            : "Nenhum colaborador encontrado para essa busca."}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtrados.map((item) => (
                                        <tr key={item.id_colaborador}>
                                            <td>{item.nome_completo}</td>
                                            <td>{item.re || "—"}</td>
                                            <td>{NIVEIS[item.nivel_acesso] || item.nivel_acesso}</td>
                                            <td>
                                                <span className={`equipe-status ${item.ativo ? "ativo" : "inativo"}`}>
                                                    {item.ativo ? "Ativo" : "Inativo"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="equipe-acoes">
                                                    <button
                                                        className="btn-salvar"
                                                        onClick={() => navigate(`/formUsuario/${item.id_colaborador}`)}
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default Equipe;