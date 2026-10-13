import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FichaModal from "../components/FichaModal";
import EditarPedidoModal from "../components/EditarPedidoModal";
import { listarPedidos, buscarPedido, excluirPedido, atualizarPedido } from "../services/pedidosService";
import { infoStatus } from "../utils/status";
import { infoPrioridade } from "../utils/prioridade";
import "../styles/padrao.css";
import "../styles/Pedidos.css";
import "../styles/ficha-tecnica.css";


function Pedidos() {
    // O filtro vem da URL: /pedidos?status=pendente
    const [searchParams, setSearchParams] = useSearchParams();
    const filtro = searchParams.get("status") || "";
    const [tab, setTab] = useState(filtro === "finalizado" ? "historico" : "recentes");
    const [pedidos, setPedidos] = useState([]);
    const [fichaAberta, setFichaAberta] = useState(null);
    const [pedidoEditando, setPedidoEditando] = useState(null);
    const emHistorico = tab === "historico";
    const navigate = useNavigate();

    function voltar() {
        setSearchParams({}); // limpa o filtro, senão "?status=finalizado" deixaria a lista vazia
        setTab("recentes");
    }

    useEffect(() => {
        // TODO(BACK): listarPedidos() passará a vir da API (ver pedidosService.js)
        listarPedidos().then(setPedidos);
    }, []);

    async function abrirPedido(id) {
        // TODO(BACK): GET /api/pedidos/:id (pedido completo, via buscarPedido no service)
        setFichaAberta(await buscarPedido(id));
    }

    function fecharFicha() {
        setFichaAberta(null);
    }

    async function abrirEdicao(id) {
        setPedidoEditando(await buscarPedido(id));
    }

    async function salvarEdicao(atualizado) {
        // TODO(BACK): PUT /api/pedidos/:id
        await atualizarPedido(atualizado.id, atualizado);
        setPedidos(await listarPedidos());
        setPedidoEditando(null);
    }

    async function confirmarExclusao(id) {
        if (!window.confirm(`Deseja excluir #${id}?`)) return;

        // TODO(BACK): DELETE /api/pedidos/:id (via excluirPedido no service)
        await excluirPedido(id);
        setPedidos(await listarPedidos());
    }

    function mudarFiltro(e) {
        const valor = e.target.value;
        setSearchParams(valor ? { status: valor } : {});
        setTab(valor === "finalizado" ? "historico" : "recentes");
    }

    // Filtra pela aba e pelo status escolhido no select
    const visiveis = pedidos.filter((p) => {
        const base = p.status;
        const naAba = tab === "recentes" ? base !== "finalizado" : base === "finalizado";
        const noFiltro = !filtro || base === filtro;
        return naAba && noFiltro;
    });

    // Contagem de cada aba (usada no título)
    const emAberto = pedidos.filter(
        (p) => p.status !== "finalizado"
    ).length;

    const finalizados = pedidos.length - emAberto;

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="top top-compact">
                    <div className="page-header">
                        <h1 className="page-title">
                            {emHistorico ? "Histórico de Pedidos" : "Pedidos"}{" "}
                            <span className="page-count">
                                ({emHistorico ? finalizados : emAberto})
                            </span>
                        </h1>
                    </div>

                    <div className="top-right top-right-inline">
                        <div className="search-box">
                            <span className="material-icons search-icon">search</span>

                            {/* TODO(BACK): o input ainda não filtra nada. Ligar a um state (filtro no front) ou usar GET /api/pedidos?busca= */}
                            <input className="search" placeholder="Pesquisar pedido" />
                        </div>

                        {emHistorico ? (
                            <button type="button" className="btn-historico" onClick={voltar}>
                                <span className="material-icons">arrow_back</span>
                                Voltar
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn-historico"
                                onClick={() => setTab("historico")}
                            >
                                <span className="material-icons">history</span>
                                Histórico de Pedidos
                            </button>
                        )}

                        <select
                            className="btn btn-filter"
                            value={filtro}
                            onChange={mudarFiltro}
                        >
                            <option value="">Todos os pedidos</option>
                            <option value="pendente">Pendentes</option>
                            <option value="finalizado">Finalizados</option>
                            <option value="producao">Em producao</option>
                        </select>

                        <button className="btn btn-add" type="button"
                            onClick={() => navigate("/pedidos/novo")}>
                            + Pedido
                        </button>
                    </div>
                </div>

                <div className="list">

                    {/* CABEÇALHO DA TABELA */}
                    <div className="pedidos-header">
                        <span>Pedido / Prioridade</span>
                        <span>Empresa</span>
                        <span>Status</span>
                        <span>Ações</span>
                    </div>

                    <div className="tab-content active">
                        {visiveis.length === 0 && (
                            <p style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                                Nenhum pedido encontrado.
                            </p>
                        )}

                        {visiveis.map((p) => {
                            const st = infoStatus(p);
                            const prio = infoPrioridade(p);

                            return (
                                <div
                                    className="product pedido-card"
                                    key={p.id}
                                    onClick={() => abrirPedido(p.id)}
                                >
                                    <div className="produto">
                                        <div className="img"></div>
                                        <div className="pedido-main">
                                            <span className="mobile-field-label">Pedido</span>
                                            <p>#{p.id}
                                                {prio && <span className={`prio-selo ${prio.classe}`}>{prio.texto}</span>}
                                            </p>

                                        </div>
                                    </div>

                                    <div className="empresa info-block">
                                        <span className="mobile-field-label">Empresa</span>
                                        <p>{p.ficha?.cliente || "—"}</p>
                                    </div>

                                    <div className="status-col info-block">
                                        <span className="mobile-field-label">Status</span>
                                        <span className={`status ${st.classe}`}>{st.texto}</span>
                                    </div>

                                    <div className="actions">
                                        <span className="mobile-field-label">Acoes</span>

                                        {/* TODO(BACK): PUT /api/pedidos/:id (editar pedido) */}
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={(e) => { e.stopPropagation(); abrirEdicao(p.id); }}
                                        >
                                            <span className="material-icons">edit</span>
                                        </button>

                                        <button
                                            className="action-btn delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmarExclusao(p.id);
                                            }}
                                        >
                                            <span className="material-icons">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {fichaAberta && (
                <FichaModal ficha={fichaAberta} onFechar={fecharFicha} />
            )}
            
            {pedidoEditando && (
                <EditarPedidoModal
                    pedido={pedidoEditando}
                    onFechar={() => setPedidoEditando(null)}
                    onSalvar={salvarEdicao}
                />
            )}
        </>
    );
}

export default Pedidos;