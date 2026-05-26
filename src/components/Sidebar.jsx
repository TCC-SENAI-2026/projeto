import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/padrao.css";

function Sidebar() {
    const [menuAberto, setMenuAberto] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setMenuAberto(false);
    }, [location.pathname]);

    function toggleMenu() {
        setMenuAberto((aberto) => !aberto);
    }

    function irPara(path) {
        navigate(path);
        setMenuAberto(false);
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
                onClick={() => setMenuAberto(false)}
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
                </nav>

                <div className="sidebar-footer">
                    <details className="user-dropdown">
                        <summary className="user-info">
                            <div className="user-avatar">GA</div>

                            <div className="user-text">
                                <span className="user-name">Gabrielly</span>
                                <span className="user-role">Administrador</span>
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
                                onClick={() => irPara('/')}>
                                <span className="material-icons">exit_to_app</span>
                                Sair
                            </button>
                        </div>
                    </details>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
