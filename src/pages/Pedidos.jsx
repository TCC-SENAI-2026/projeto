import { useState, useEffect, Fragment } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FichaModal from "../components/FichaModal";
import EditarPedidoModal from "../components/EditarPedidoModal";
import { listarPedidos, buscarPedido, atualizarStatus } from "../services/pedidosService";
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
    const [busca, setBusca] = useState("");
    const [ordemCliente, setOrdemCliente] = useState("asc"); // "asc" ou "desc"
    const [clientesAbertos, setClientesAbertos] = useState([]);
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

    async function mudarStatus(id, novoStatus) {
        // Mesmo bloqueio do editar e do excluir: não muda enquanto há solicitação pendente
        if (temPendente(id)) return;

        const pedidoAtual = pedidos.find(p => p.id === id);
        const numExibicao = pedidoAtual?.numero_pedido || id;
        if (
            novoStatus === "finalizado" &&
            !window.confirm(`Finalizar o pedido #${numExibicao}? Ele irá para o histórico.`)
        ) {
            return;
        }

        try {
            // TODO(BACK): PATCH /api/pedidos/:id com { status } (via atualizarStatus no service)
            await atualizarStatus(id, novoStatus);
            setPedidos(await listarPedidos());
            setFichaAberta(null); // fecha o modal, e a lista já mostra o novo status
        } catch (erro) {
            alert(erro.message || "Não foi possível atualizar o pedido.");
        }
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
                resumo: nomeCliente(p),
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

    const nomeCliente = (p) => p.nome_cliente || p.ficha?.cliente || "Sem cliente";
    const termo = busca.trim().toLowerCase().replace("#", "");

    const visiveis = pedidos.filter((p) => {
        const naAba = tab === "recentes" ? p.status !== "finalizado" : p.status === "finalizado";
        const noFiltro = !filtro || p.status === filtro;
        const naBusca =
            !termo ||
            String(p.numero_pedido || p.id).includes(termo) ||
            String(p.id).includes(termo) ||
            nomeCliente(p).toLowerCase().includes(termo);
        return naAba && noFiltro && naBusca;
    });

    // No histórico os pedidos ficam agrupados por cliente, em ordem alfabética
    if (emHistorico) {
        visiveis.sort(
            (a, b) =>
                nomeCliente(a).localeCompare(nomeCliente(b), "pt-BR") *
                (ordemCliente === "asc" ? 1 : -1)
        );
    }

    const totalPorCliente = {};
    visiveis.forEach((p) => {
        totalPorCliente[nomeCliente(p)] = (totalPorCliente[nomeCliente(p)] || 0) + 1;
    });

    function alternarCliente(nome) {
        setClientesAbertos((atual) =>
            atual.includes(nome) ? atual.filter((n) => n !== nome) : [...atual, nome]
        );
    }

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

                            <input
                                className="search"
                                placeholder="Pesquisar pedido ou cliente"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
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

                        {!emHistorico && (
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
                        )}

                        {emHistorico && (
                            <button
                                type="button"
                                className="btn-historico"
                                onClick={() => setOrdemCliente((o) => (o === "asc" ? "desc" : "asc"))}
                            >
                                <span className="material-icons">sort_by_alpha</span>
                                Cliente {ordemCliente === "asc" ? "A–Z" : "Z–A"}
                            </button>
                        )}
                        
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

                        {visiveis.map((p, i) => {
                            const st = infoStatus(p);
                            const prio = infoPrioridade(p);
                            const aguardando = temPendente(p.id);

                            const grupo = nomeCliente(p);
                            const primeiroDoGrupo = i === 0 || nomeCliente(visiveis[i - 1]) !== grupo;
                            // com busca ativa, tudo fica aberto para não esconder resultado
                            const recolhido = emHistorico && !termo && !clientesAbertos.includes(grupo);

                            return (
                                <Fragment key={p.id}>
                                    {emHistorico && primeiroDoGrupo && (
                                        <button
                                            type="button"
                                            className="grupo-cliente"
                                            onClick={() => alternarCliente(grupo)}
                                        >
                                            <span className="material-icons">
                                                {recolhido ? "chevron_right" : "expand_more"}
                                            </span>
                                            {grupo}
                                            <span>({totalPorCliente[grupo]})</span>
                                        </button>
                                    )}

                                    {!recolhido && (
                                        <div
                                            className="product pedido-card"
                                            onClick={() => abrirPedido(p.id)}
                                        >
                                            <div className="produto">
                                                <div className="img"></div>
                                                <div className="pedido-main">
                                                    <span className="mobile-field-label">Pedido</span>
                                                    <p>
                                                        <strong>#{p.numero_pedido || p.id}</strong>
                                                        {prio && <span className={`prio-selo ${prio.classe}`}>{prio.texto}</span>}
                                                    </p>
                                                    {p.nome_colaborador && (
                                                        <p className="pedido-colaborador">
                                                            Colaborador: {p.nome_colaborador}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="empresa info-block">
                                                <span className="mobile-field-label">Empresa</span>
                                                <p>{nomeCliente(p)}</p>
                                            </div>

                                            <div className="status-col info-block">
                                                <span className="mobile-field-label">Status</span>
                                                <span className={`status ${st.classe}`}>{st.texto}</span>
                                            </div>

                                            <div className="actions">
                                                <span className="mobile-field-label">Acoes</span>

                                                {emHistorico ? (
                                                    <button
                                                        className="action-btn"
                                                        title="Ver ficha técnica"
                                                        aria-label="Ver ficha técnica"
                                                        onClick={(e) => { e.stopPropagation(); abrirPedido(p.id); }}
                                                    >
                                                        <span className="material-icons">visibility</span>
                                                    </button>
                                                ) : (
                                                    <>
                                                        {p.status === "pendente" && (
                                                            <button
                                                                className="action-btn iniciar-btn"
                                                                disabled={aguardando}
                                                                title={aguardando ? "Aguardando aprovação do administrador" : "Iniciar pedido"}
                                                                aria-label="Iniciar pedido"
                                                                onClick={(e) => { e.stopPropagation(); mudarStatus(p.id, "producao"); }}
                                                            >
                                                                <span className="material-icons">play_arrow</span>
                                                            </button>
                                                        )}

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
                                                            onClick={(e) => { e.stopPropagation(); pedirExclusao(p); }}
                                                        >
                                                            <span className="material-icons">delete</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {fichaAberta && (
                <FichaModal
                    ficha={fichaAberta}
                    onFechar={fecharFicha}
                    bloqueado={temPendente(fichaAberta.id)}
                    onIniciar={() => mudarStatus(fichaAberta.id, "producao")}
                    onFinalizar={() => mudarStatus(fichaAberta.id, "finalizado")}
                />
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