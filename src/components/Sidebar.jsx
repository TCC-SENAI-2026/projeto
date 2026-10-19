import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import "../styles/padrao.css";

function Sidebar() {
    const [menuAbertoEm, setMenuAbertoEm] = useState(null);
    const [saindo, setSaindo] = useState(false);
    const [erroLogout, setErroLogout] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // TODO(BACK): garantir que o endpoint de sessão retorne
    // os dados do usuário autenticado, incluindo nome e nivel_acesso.
    const { colaborador, sair } = useAuth();
    const menuAberto = menuAbertoEm === location.pathname;
    const administrador = colaborador?.nivel_acesso === "administrador";
    const partesNome = colaborador?.nome.trim().split(/\s+/) || [];
    const iniciais = [partesNome[0], partesNome.length > 1 ? partesNome.at(-1) : null]
        .filter(Boolean).map((nome) => nome[0]).join("").toUpperCase();

    function toggleMenu() {
        setMenuAbertoEm(menuAberto ? null : location.pathname);
    }

    function irPara(path) {
        navigate(path);
        setMenuAbertoEm(null);
    }

    async function handleLogout() {
        if (saindo) return;
        setSaindo(true);
        setErroLogout("");
        try {
            await sair();
            navigate("/", { replace: true });
        } catch (error) {
            // Só saímos da interface depois que o Flask encerra a sessão.
            setErroLogout(error.message);
        } finally {
            setSaindo(false);
        }
    }

    return (
        <>
            <header className="mobile-topbar">
                <button
                    type="button"
                    className="mobile-menu-toggle"
                    onClick={toggleMenu}
                    aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={menuAberto}
                >
                    <span className="material-icons">
                        {menuAberto ? "close" : "menu"}
                    </span>
                </button>

                <button
                    type="button"
                    className="mobile-brand"
                    onClick={() => irPara("/home")}
                    aria-label="Ir para o inicio"
                >
                    <img
                        className="logo-nome"
                        src="/img/E-threads3.png"
                        alt="Logo E-threads"
                    />
                </button>

                <div className="mobile-topbar-spacer" aria-hidden="true"></div>
            </header>

            <button
                type="button"
                className={`sidebar-overlay ${menuAberto ? "active" : ""}`}
                onClick={() => setMenuAbertoEm(null)}
                aria-label="Fechar menu lateral"
            ></button>

            <aside className={`sidebar ${menuAberto ? "mobile-open" : ""}`}>
                <div className="logo-sidebar">
                    <img
                        className="logo-nome"
                        src="/img/E-threads3.png"
                        alt="Logo E-threads"
                    />
                </div>

                <hr />

                <nav className="menu">
                    <button type="button" onClick={() => irPara("/home")}>
                        <span className="menu-link-left">
                            <span className="material-icons">dashboard</span>
                            Inicio
                        </span>
                    </button>

                    <details className="menu-dropdown">
                        <summary>
                            <span className="summary-left">
                                <span className="material-icons">receipt_long</span>
                                Pedidos
                            </span>
                            <span className="material-icons seta">expand_more</span>
                        </summary>

                        <div className="submenu">
                            <button type="button" onClick={() => irPara("/pedidos/novo")}>
                                Criar novo pedido
                            </button>
                            <button type="button" onClick={() => irPara("/pedidos")}>
                                Lista de pedidos
                            </button>
                        </div>
                    </details>

                    <button type="button" onClick={() => irPara("/estoque")}>
                        <span className="menu-link-left">
                            <span className="material-icons">inventory_2</span>
                            Estoque
                        </span>
                    </button>

                    <button type="button" onClick={() => irPara("/clientes")}>
                        <span className="menu-link-left">
                            <span className="material-icons">group</span>
                            Clientes
                        </span>
                    </button>

                    {administrador && <>
                        <button type="button" onClick={() => irPara("/equipe")}>
                            <span className="menu-link-left">
                                <span className="material-icons">badge</span>
                                Colaboradores
                            </span>
                        </button>

                        <button type="button" onClick={() => irPara("/relatorio")}>
                            <span className="menu-link-left">
                                <span className="material-icons">bar_chart</span>
                                Relatorios
                            </span>
                        </button>
                        <button type="button" onClick={() => irPara("/painel-adm")}>
                            <span className="menu-link-left">
                                <span className="material-icons">security</span>
                                Painel Adm
                            </span>
                        </button>
                    </>}
                </nav>

                <div className="sidebar-footer">
                    <details className="user-dropdown">
                        <summary className="user-info">
                            <div className="user-avatar">{iniciais}</div>

                            <div className="user-text">
                                <span className="user-name">{colaborador?.nome}</span>
                                <span className="user-role">{administrador ? "Administrador" : "Colaborador"}</span>
                            </div>

                            <span className="material-icons user-arrow">unfold_more</span>
                        </summary>

                        <div className="user-menu">

                            <button
                                type="button"
                                className="user-option"
                                onClick={() => irPara("/perfil")}
                            >
                                <span className="material-icons">person</span>
                                Perfil
                            </button>


                            <button
                                type="button"
                                className="logout-btn"
                                disabled={saindo}
                                onClick={handleLogout}>
                                <span className="material-icons">exit_to_app</span>
                                {saindo ? "Saindo..." : "Sair"}
                            </button>
                            {erroLogout && <p role="alert">{erroLogout}</p>}
                        </div>
                    </details>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
