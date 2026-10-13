import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FichaModal from "../components/FichaModal";
import EditarPedidoModal from "../components/EditarPedidoModal";
import { listarPedidos, buscarPedido } from "../services/pedidosService";
import AvisoTopo from "../components/AvisoTopo";
import useSolicitacoesPedido from "../hooks/useSolicitacoesPedido";
import "../styles/solicitacoes.css";
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
    const { mensagem, resultados, temPendente, solicitar, fecharResultado } =
        useSolicitacoesPedido();

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
        // Enquanto houver solicitação pendente, o botão fica bloqueado (checagem extra de segurança)
        if (temPendente(id)) return;
        setPedidoEditando(await buscarPedido(id));
    }

    // O funcionário não salva direto: envia uma solicitação para o adm aprovar.
    // Se der erro, a exceção sobe para o modal, que continua aberto com a mensagem.
    async function enviarSolicitacao(dados) {
        // TODO(BACK): POST /api/solicitacoes (ver solicitacoesService.js)
        await solicitar(dados);
        setPedidoEditando(null); // sucesso: fecha o modal e a mensagem aparece no topo
    }


    // O funcionário não exclui direto: envia uma solicitação, com o motivo, para o adm aprovar.
    async function pedirExclusao(p) {
        if (temPendente(p.id)) return;

        const justificativa = window.prompt(
            `Por que você quer excluir o pedido #${p.id}?\n` +
            "O administrador vai ler sua resposta antes de decidir."
        );
        if (justificativa === null) return; // clicou em Cancelar

        try {
            // TODO(BACK): POST /api/solicitacoes com tipo "exclusao" (ver solicitacoesService.js)
            await solicitar({
                tipo: "exclusao",
                pedidoId: p.id,
                resumo: p.ficha?.cliente || "",
                justificativa,
            });
        } catch (erro) {
            // Ex.: motivo curto demais ("Explique o motivo da exclusão...")
            alert(erro.message || "Não foi possível enviar a solicitação.");
        }
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

                {/* AVISOS NO TOPO DA SEÇÃO */}

                <AvisoTopo
                    mensagem={mensagem}
                    resultados={resultados}
                    onFecharResultado={fecharResultado}
                />
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
                            const aguardando = temPendente(p.id);

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

                                        {/* Bloqueado enquanto houver solicitação pendente de aprovação */}
                                        <button
                                            className="action-btn edit-btn"
                                            disabled={aguardando}
                                            title={aguardando ? "Aguardando aprovação do administrador" : "Editar pedido"}
                                            aria-label={aguardando ? "Edição bloqueada: aguardando aprovação do administrador" : "Editar pedido"}
                                            onClick={(e) => { e.stopPropagation(); abrirEdicao(p.id); }}
                                        >
                                            <span className="material-icons">edit</span>
                                        </button>

                                        <button
                                            className="action-btn delete-btn"
                                            disabled={aguardando}
                                            title={aguardando ? "Aguardando aprovação do administrador" : "Excluir pedido"}
                                            aria-label={aguardando ? "Exclusão bloqueada: aguardando aprovação do administrador" : "Excluir pedido"}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                pedirExclusao(p);
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
                    onSolicitar={enviarSolicitacao}
                />
            )}
        </>
    );
}

export default Pedidos;