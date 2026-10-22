import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import {
    listarSolicitacoes,
    decidirSolicitacao,
} from "../services/solicitacoesService";
import "../styles/padrao.css";
import "../styles/PainelAdm.css";
import "../styles/solicitacoes.css";

// Status do service ("pendente") -> status que o painel usa nos filtros ("Pendentes")
const STATUS_PAINEL = {
    pendente: "Pendentes",
    aprovada: "Aprovadas",
    recusada: "Recusadas",
};


// "2026-10-13T12:00:00.000Z" -> "13/10/2026 · 09:00"
function formatarDataHora(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const data = d.toLocaleDateString("pt-BR");
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${data} · ${hora}`;
}

// Converte uma solicitação do service para o formato dos cards do painel
function paraCard(s) {
    const exclusao = s.tipo === "exclusao";

    return {
        id: s.id,
        origem: exclusao ? "exclusao-pedido" : "edicao-pedido",
        tipo: exclusao ? "Exclusão de pedido" : "Alteração de pedido",
        categoria: "Pedidos",
        status: STATUS_PAINEL[s.status],
        icone: exclusao ? "delete" : "edit",
        classe: exclusao ? "exclusao" : "alteracao",
        identificacao: `Pedido #${s.pedidoId}`,
        pessoa: s.solicitante,
        detalhe: exclusao
            ? s.resumo || "Sem identificação"
            : `${s.alteracoes.length} campo(s) alterado(s)`,
        data: formatarDataHora(s.criadoEm),
        visualizar: exclusao ? "Visualizar" : "Ver alteração",
        autorizar: "Autorizar",
        alteracoes: exclusao ? undefined : s.alteracoes,
        motivo: s.motivo,
        justificativa: s.justificativa,
    };
}

function rotuloStatus(status) {
    if (status === "Pendentes") return "PENDENTE";
    if (status === "Aprovadas") return "APROVADA";
    return "RECUSADA";
}

function PainelAdm() {

    const [filtroTipo, setFiltroTipo] = useState("Todas");
    const [filtroStatus, setFiltroStatus] = useState("Pendentes");

    const [reais, setReais] = useState([]);
    const [erroCarregar, setErroCarregar] = useState("");

    const [selecionadaId, setSelecionadaId] = useState(null);
    const [modalAcao, setModalAcao] = useState(null);
    const [modalVisualizacao, setModalVisualizacao] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [erroAcao, setErroAcao] = useState("");
    const [processando, setProcessando] = useState(false);

    const carregar = useCallback(async () => {
        setErroCarregar("");
        try {
            setReais(await listarSolicitacoes());
        } catch (erro) {
            console.error("Erro ao carregar solicitações:", erro);
            setErroCarregar(erro.message || "Não foi possível carregar as solicitações.");
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const todas = reais.map(paraCard);
    const solicitacaoSelecionada = todas.find((s) => s.id === selecionadaId) || null;
    const totalPendentes = todas.filter((s) => s.status === "Pendentes").length;

    const solicitacoesFiltradas = todas.filter((solicitacao) => {
        const correspondeTipo =
            filtroTipo === "Todas" || solicitacao.categoria === filtroTipo;
        const correspondeStatus = solicitacao.status === filtroStatus;
        return correspondeTipo && correspondeStatus;
    });

    function fecharModais() {
        setSelecionadaId(null);
        setModalAcao(null);
        setModalVisualizacao(false);
        setMotivo("");
        setErroAcao("");
    }

    const confirmarAcao = async () => {
        if (!solicitacaoSelecionada || !modalAcao || processando) return;

        const decisao = modalAcao === "autorizar" ? "aprovada" : "recusada";
        setProcessando(true);
        setErroAcao("");

        try {
            // TODO(BACK): PATCH /api/solicitacoes/:id (ver solicitacoesService.js)
            await decidirSolicitacao(solicitacaoSelecionada.id, decisao, motivo);
            await carregar();
            fecharModais();
        } catch (erro) {
            setErroAcao(erro.message || "Não foi possível registrar a decisão.");
        } finally {
            setProcessando(false);
        }
    };

    return (
        <div className="container">

            <Sidebar />


            <main className="painel-adm-content">

                {/* CABEÇALHO */}
                <header className="painel-header">

                    <div className="painel-title-icon">
                        <span className="material-icons">
                            shield
                        </span>
                    </div>

                    <div>
                        <h1>Central Administrativa</h1>
                        <p>
                            Solicitações que precisam da sua atenção.
                        </p>
                    </div>

                </header>


                {/* RESUMO */}
                <section className="painel-resumo">

                    <div className="resumo-icon">
                        <span className="material-icons">
                            notifications
                        </span>
                    </div>

                    <div>
                        <strong>{totalPendentes}</strong>
                        <span>Solicitações pendentes</span>
                    </div>

                </section>


                {/* FILTROS */}
                <section className="painel-filtros">

                    <div className="filtros-tipos">
                        <button
                            className={`filtro ${filtroTipo === "Todas" ? "ativo" : ""}`}
                            onClick={() => setFiltroTipo("Todas")}
                        >
                            Todas
                        </button>

                        <button
                            className={`filtro ${filtroTipo === "Pedidos" ? "ativo" : ""}`}
                            onClick={() => setFiltroTipo("Pedidos")}
                        >
                            Pedidos
                        </button>

                        <button
                            className={`filtro ${filtroTipo === "Estoque" ? "ativo" : ""}`}
                            onClick={() => setFiltroTipo("Estoque")}
                        >
                            Estoque
                        </button>

                    </div>


                    <div className="filtros-status">
                        <button
                            className={`filtro-status ${filtroStatus === "Pendentes" ? "ativo" : ""}`}
                            onClick={() => setFiltroStatus("Pendentes")}
                        >
                            Pendentes
                        </button>

                        <button
                            className={`filtro-status ${filtroStatus === "Aprovadas" ? "ativo" : ""}`}
                            onClick={() => setFiltroStatus("Aprovadas")}
                        >
                            Aprovadas
                        </button>

                        <button
                            className={`filtro-status ${filtroStatus === "Recusadas" ? "ativo" : ""}`}
                            onClick={() => setFiltroStatus("Recusadas")}
                        >
                            Recusadas
                        </button>
                    </div>

                </section>


                {/* TÍTULO */}
                <div className="solicitacoes-header">

                    <h2>Solicitações recentes</h2>

                    <button className="ver-todas" onClick={() => setFiltroTipo("Todas")}>
                        Ver todas
                        <span>→</span>
                    </button>

                </div>




                {/* SOLICITAÇÕES */}
                {erroCarregar && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
                        padding: '14px 18px', marginBottom: 16, display: 'flex',
                        alignItems: 'center', gap: 10, color: '#b91c1c', fontSize: 14,
                    }}>
                        <span className="material-icons" style={{ fontSize: 20 }}>error</span>
                        <span style={{ flex: 1 }}>{erroCarregar}</span>
                        <button
                            type="button"
                            onClick={carregar}
                            style={{
                                background: '#b91c1c', color: '#fff', border: 'none',
                                borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
                            }}
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                <section className="solicitacoes-lista">

                    {solicitacoesFiltradas.map((solicitacao) => (

                        <article
                            className="solicitacao"
                            key={solicitacao.id}
                        >

                            <div
                                className={`solicitacao-icone ${solicitacao.classe}`}
                            >
                                <span className="material-icons">
                                    {solicitacao.icone}
                                </span>
                            </div>


                            <div className="solicitacao-info">

                                <div className="solicitacao-titulo">

                                    <h3>
                                        {solicitacao.tipo}
                                    </h3>

                                    <span className={`status-${solicitacao.status.toLowerCase()}`}>
                                        {rotuloStatus(solicitacao.status)}
                                    </span>

                                </div>


                                <div className="solicitacao-detalhes">

                                    <span>
                                        {solicitacao.identificacao}
                                    </span>

                                    <span>•</span>

                                    <span>
                                        {solicitacao.pessoa}
                                    </span>

                                    <span>•</span>

                                    <span>
                                        {solicitacao.detalhe}
                                    </span>

                                </div>


                                {solicitacao.data && (
                                    <span className="solicitacao-data">

                                        <span className="material-icons">
                                            calendar_today
                                        </span>

                                        {solicitacao.data}

                                    </span>
                                )}

                            </div>


                            <div className="solicitacao-acoes">

                                <button
                                    className="btn-visualizar"
                                    onClick={() => {
                                        setSelecionadaId(solicitacao.id);
                                        setModalVisualizacao(true);
                                    }}
                                >
                                    <span className="material-icons">
                                        visibility
                                    </span>
                                    {solicitacao.visualizar}
                                </button>

                                {solicitacao.status === "Pendentes" && (
                                    <>
                                        <button
                                            className="btn-recusar"
                                            onClick={() => {
                                                setSelecionadaId(solicitacao.id);
                                                setModalAcao("recusar");
                                            }}
                                        >
                                            <span className="material-icons">
                                                close
                                            </span>
                                            Recusar
                                        </button>

                                        <button
                                            className={`btn-autorizar ${solicitacao.classe === "senha"
                                                ? "btn-redefinir"
                                                : ""
                                                }`}
                                            onClick={() => {
                                                setSelecionadaId(solicitacao.id);
                                                setModalAcao("autorizar");
                                            }}
                                        >
                                            <span className="material-icons">
                                                check
                                            </span>
                                            {solicitacao.autorizar}
                                        </button>
                                    </>
                                )}

                                {solicitacao.status === "Aprovadas" && (
                                    <span className="acao-finalizada aprovada">
                                        <span className="material-icons">
                                            check_circle
                                        </span>
                                        Aprovada
                                    </span>
                                )}

                                {solicitacao.status === "Recusadas" && (
                                    <span className="acao-finalizada recusada">
                                        <span className="material-icons">
                                            cancel
                                        </span>
                                        Recusada
                                    </span>
                                )}

                            </div>

                        </article>

                    ))}

                    {solicitacoesFiltradas.length === 0 && (
                        <p style={{ color: "#64748b", textAlign: "center", padding: "24px 0" }}>
                            Nenhuma solicitação por aqui.
                        </p>
                    )}

                </section>


                {modalAcao && solicitacaoSelecionada && (
                    <div className="modal-overlay">
                        <div className="modal-confirmacao">

                            <h2>
                                {modalAcao === "autorizar"
                                    ? "Autorizar solicitação?"
                                    : "Recusar solicitação?"}
                            </h2>

                            <p>
                                Tem certeza que deseja{" "}
                                {modalAcao === "autorizar"
                                    ? "autorizar"
                                    : "recusar"}{" "}
                                esta solicitação?
                            </p>

                            {solicitacaoSelecionada.justificativa && (
                                <p>
                                    <strong>Motivo informado:</strong>{" "}
                                    {solicitacaoSelecionada.justificativa}
                                </p>
                            )}

                            {modalAcao === "autorizar" &&
                                solicitacaoSelecionada.origem === "exclusao-pedido" && (
                                    <p>O pedido será excluído e não poderá ser recuperado.</p>
                                )}

                            {/* Motivo opcional, só para recusa de alteração de pedido */}
                            {modalAcao === "recusar" && (
                                <textarea
                                    className="campo-motivo"
                                    rows={3}
                                    placeholder="Motivo da recusa (opcional)"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                />
                            )}

                            {erroAcao && <p className="erro-acao" role="alert">{erroAcao}</p>}

                            <div className="modal-acoes">
                                <button
                                    className="btn-cancelar"
                                    onClick={fecharModais}
                                    disabled={processando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    className={
                                        modalAcao === "autorizar"
                                            ? "btn-confirmar"
                                            : "btn-confirmar recusar"
                                    }
                                    onClick={confirmarAcao}
                                    disabled={processando}
                                >
                                    {processando
                                        ? "Aguarde..."
                                        : modalAcao === "autorizar"
                                            ? "Autorizar"
                                            : "Recusar"}
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {modalVisualizacao && solicitacaoSelecionada && (
                    <div className="modal-overlay">
                        <div className="modal-confirmacao modal-detalhes">

                            <div className="modal-detalhes-header">
                                <div
                                    className={`solicitacao-icone ${solicitacaoSelecionada.classe}`}
                                >
                                    <span className="material-icons">
                                        {solicitacaoSelecionada.icone}
                                    </span>
                                </div>

                                <div>
                                    <h2>{solicitacaoSelecionada.tipo}</h2>
                                    <span
                                        className={`status-${solicitacaoSelecionada.status.toLowerCase()}`}
                                    >
                                        {rotuloStatus(solicitacaoSelecionada.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="modal-detalhes-conteudo">

                                <div className="detalhe-item">
                                    <span>Identificação</span>
                                    <strong>
                                        {solicitacaoSelecionada.identificacao}
                                    </strong>
                                </div>

                                <div className="detalhe-item">
                                    <span>Solicitado por</span>
                                    <strong>
                                        {solicitacaoSelecionada.pessoa}
                                    </strong>
                                </div>

                                {solicitacaoSelecionada.origem !== "edicao-pedido" && (
                                    <div className="detalhe-item">
                                        <span>Detalhes</span>
                                        <strong>
                                            {solicitacaoSelecionada.detalhe}
                                        </strong>
                                    </div>
                                )}

                                {solicitacaoSelecionada.data && (
                                    <div className="detalhe-item">
                                        <span>Data da solicitação</span>
                                        <strong>
                                            {solicitacaoSelecionada.data}
                                        </strong>
                                    </div>
                                )}

                                {solicitacaoSelecionada.justificativa && (
                                    <div className="detalhe-item">
                                        <span>Motivo da exclusão</span>
                                        <strong>{solicitacaoSelecionada.justificativa}</strong>
                                    </div>
                                )}

                                {solicitacaoSelecionada.motivo && (
                                    <div className="detalhe-item">
                                        <span>Motivo da recusa</span>
                                        <strong>{solicitacaoSelecionada.motivo}</strong>
                                    </div>
                                )}

                                {/* ANTES → DEPOIS */}
                                {solicitacaoSelecionada.alteracoes && (
                                    <div className="lista-alteracoes">
                                        {solicitacaoSelecionada.alteracoes.map((a) => (
                                            <div className="alteracao-item" key={a.campo}>
                                                <span>{a.rotulo}</span>
                                                <div className="alteracao-valores">
                                                    <span className="alteracao-antigo">{a.antigo}</span>
                                                    <span>→</span>
                                                    <span className="alteracao-novo">{a.novo}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>

                            <div className="modal-acoes">
                                <button
                                    className="btn-cancelar"
                                    onClick={fecharModais}
                                >
                                    Fechar
                                </button>
                            </div>

                        </div>
                    </div>
                )}


            </main>

        </div>
    );
}

export default PainelAdm;