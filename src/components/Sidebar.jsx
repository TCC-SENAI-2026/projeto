import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import FotoColaborador from "./FotoColaborador";
import "../styles/padrao.css";

function Sidebar() {
    const [menuAbertoEm, setMenuAbertoEm] = useState(null);
    const [recolhido, setRecolhido] = useState(
        () => window.matchMedia("(min-width: 769px)").matches
            && sessionStorage.getItem("sidebar-recolhido") === "true"
    );
    const [saindo, setSaindo] = useState(false);
    const [erroLogout, setErroLogout] = useState("");
    const [submenuPosicao, setSubmenuPosicao] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const pedidosRef = useRef(null);

    const { colaborador, sair } = useAuth();
    const menuAberto = menuAbertoEm === location.pathname;
    const administrador = colaborador?.nivel_acesso === "administrador";

    useLayoutEffect(() => {
        document.body.classList.toggle("sidebar-recolhido", recolhido);
        return () => document.body.classList.remove("sidebar-recolhido");
    }, [recolhido]);

    useLayoutEffect(() => {
        const breakpointMobile = window.matchMedia("(max-width: 768px)");
        const sincronizarRecolhimento = (event) => {
            setRecolhido(
                !event.matches
                && sessionStorage.getItem("sidebar-recolhido") === "true"
            );
        };

        breakpointMobile.addEventListener("change", sincronizarRecolhimento);
        return () => breakpointMobile.removeEventListener("change", sincronizarRecolhimento);
    }, []);

    function toggleMenu() {
        setMenuAbertoEm(menuAberto ? null : location.pathname);
    }

    function irPara(path) {
        navigate(path);
        setMenuAbertoEm(null);
    }

    function alternarSidebar() {
        setRecolhido((atual) => {
            const novoEstado = !atual;
            sessionStorage.setItem("sidebar-recolhido", String(novoEstado));
            return novoEstado;
        });
    }

    function posicionarSubmenuPedidos() {
        if (!recolhido || !pedidosRef.current) return;

        const summary = pedidosRef.current.querySelector("summary");
        if (!summary) return;

        const { top, right } = summary.getBoundingClientRect();
        const maxTop = Math.max(8, window.innerHeight - 124);
        setSubmenuPosicao({
            top: Math.min(Math.max(8, top), maxTop),
            left: right + 8,
        });
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
            </header>

            <button
                type="button"
                className={`sidebar-overlay ${menuAberto ? "active" : ""}`}
                onClick={() => setMenuAbertoEm(null)}
                aria-label="Fechar menu lateral"
            ></button>

            <aside className={`sidebar ${menuAberto ? "mobile-open" : ""} ${recolhido ? "sidebar-collapsed" : ""}`}>
                <div className="logo-sidebar">
                    <img
                        className="logo-nome"
                        src={recolhido ? "/img/logo.png" : "/img/E-threads3.png"}
                        alt="Logo E-threads"
                    />
                    <button
                        type="button"
                        className="sidebar-collapse-toggle"
                        onClick={alternarSidebar}
                        aria-label={recolhido ? "Expandir menu lateral" : "Recolher menu lateral"}
                        aria-expanded={!recolhido}
                        title={recolhido ? "Expandir menu" : "Recolher menu"}
                    >
                        <span className="material-icons" aria-hidden="true">
                            {recolhido ? "chevron_right" : "chevron_left"}
                        </span>
                    </button>
                </div>

                <hr />

                <nav className="menu">
                    <button
                        type="button"
                        title="Início"
                        className={location.pathname === "/home" ? "menu-item-active" : ""}
                        onClick={() => irPara("/home")}
                    >
                        <span className="menu-link-left">
                            <span className="material-icons">dashboard</span>
                            Inicio
                        </span>
                    </button>

                    <details
                        ref={pedidosRef}
                        className={`menu-dropdown ${location.pathname.startsWith("/pedidos") ? "menu-item-active" : ""}`}
                        onMouseEnter={posicionarSubmenuPedidos}
                        onFocus={posicionarSubmenuPedidos}
                        onToggle={posicionarSubmenuPedidos}
                    >
                        <summary title="Pedidos">
                            <span className="summary-left">
                                <span className="material-icons">receipt_long</span>
                                Pedidos
                            </span>
                            <span className="material-icons seta">expand_more</span>
                        </summary>

                        <div
                            className="submenu"
                            style={submenuPosicao ? {
                                top: `${submenuPosicao.top}px`,
                                left: `${submenuPosicao.left}px`,
                            } : undefined}
                        >
                            <button type="button" onClick={() => irPara("/pedidos/novo")}>
                                Criar novo pedido
                            </button>
                            <button type="button" onClick={() => irPara("/pedidos")}>
                                Lista de pedidos
                            </button>
                        </div>
                    </details>

                    <button
                        type="button"
                        title="Estoque"
                        className={location.pathname === "/estoque" ? "menu-item-active" : ""}
                        onClick={() => irPara("/estoque")}
                    >
                        <span className="menu-link-left">
                            <span className="material-icons">inventory_2</span>
                            Estoque
                        </span>
                    </button>

                    <button
                        type="button"
                        title="Clientes"
                        className={location.pathname === "/clientes" ? "menu-item-active" : ""}
                        onClick={() => irPara("/clientes")}
                    >
                        <span className="menu-link-left">
                            <span className="material-icons">group</span>
                            Clientes
                        </span>
                    </button>

                    {administrador && <>
                        <button
                            type="button"
                            title="Colaboradores"
                            className={location.pathname === "/equipe" ? "menu-item-active" : ""}
                            onClick={() => irPara("/equipe")}
                        >
                            <span className="menu-link-left">
                                <span className="material-icons">badge</span>
                                Colaboradores
                            </span>
                        </button>

                        <button
                            type="button"
                            title="Relatórios"
                            className={location.pathname === "/relatorio" ? "menu-item-active" : ""}
                            onClick={() => irPara("/relatorio")}
                        >
                            <span className="menu-link-left">
                                <span className="material-icons">bar_chart</span>
                                Relatorios
                            </span>
                        </button>
                        <button
                            type="button"
                            title="Painel Adm"
                            className={location.pathname === "/painel-adm" ? "menu-item-active" : ""}
                            onClick={() => irPara("/painel-adm")}
                        >
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
                            <FotoColaborador
                                key={colaborador?.id}
                                id={colaborador?.id}
                                nome={colaborador?.nome || ""}
                                pequena
                            />

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
