import { useState } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/PainelAdm.css";

const solicitacoesIniciais = [
    {
        tipo: "Exclusão de pedido",
        categoria: "Pedidos",
        status: "Pendentes",
        icone: "delete",
        classe: "exclusao",
        identificacao: "Pedido #1024",
        pessoa: "João Silva",
        detalhe: "Empresa XPTO",
        data: "05/10/2026 · 13:42",
        visualizar: "Visualizar",
        autorizar: "Autorizar",
    },

    {
        tipo: "Alteração de estoque",
        categoria: "Estoque",
        status: "Pendentes",
        icone: "edit",
        classe: "alteracao",
        identificacao: "Camiseta Polo",
        pessoa: "Maria Souza",
        detalhe: "Quantidade: 120 → 150",
        data: "",
        visualizar: "Ver alteração",
        autorizar: "Autorizar",
    },

];


function PainelAdm() {

    const [filtroTipo, setFiltroTipo] = useState("Todas");
    const [filtroStatus, setFiltroStatus] = useState("Pendentes");

    const [solicitacoes, setSolicitacoes] = useState(solicitacoesIniciais);
    const [mostrarTodas, setMostrarTodas] = useState(false);

    const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
    const [modalAcao, setModalAcao] = useState(null);
    const [modalVisualizacao, setModalVisualizacao] = useState(false);

    const solicitacoesFiltradas = solicitacoes.filter((solicitacao) => {

        const correspondeTipo =
            filtroTipo === "Todas" ||
            solicitacao.categoria === filtroTipo;

        const correspondeStatus =
            solicitacao.status === filtroStatus;

        return correspondeTipo && correspondeStatus;
    });

    

    const confirmarAcao = () => {
        if (!solicitacaoSelecionada || !modalAcao) return;

        setSolicitacoes((solicitacoesAtuais) =>
            solicitacoesAtuais.map((solicitacao) =>
                solicitacao === solicitacaoSelecionada
                    ? {
                        ...solicitacao,
                        status:
                            modalAcao === "autorizar"
                                ? "Aprovadas"
                                : "Recusadas",
                    }
                    : solicitacao
            )
        );

        setSolicitacaoSelecionada(null);
        setModalAcao(null);
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
                        <strong>5</strong>
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

                    <button className="ver-todas">
                        Ver todas
                        <span>→</span>
                    </button>

                </div>


                {/* SOLICITAÇÕES */}
                <section className="solicitacoes-lista">

                    {solicitacoesFiltradas.map((solicitacao, index) => (

                        <article
                            className="solicitacao"
                            key={index}
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
                                        {solicitacao.status === "Pendentes"
                                            ? "PENDENTE"
                                            : solicitacao.status === "Aprovadas"
                                                ? "APROVADA"
                                                : "RECUSADA"}
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
                                        setSolicitacaoSelecionada(solicitacao);
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
                                                setSolicitacaoSelecionada(solicitacao);
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
                                                setSolicitacaoSelecionada(solicitacao);
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

                            <div className="modal-acoes">
                                <button
                                    className="btn-cancelar"
                                    onClick={() => {
                                        setSolicitacaoSelecionada(null);
                                        setModalAcao(null);
                                    }}
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
                                >
                                    {modalAcao === "autorizar"
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
                                        {solicitacaoSelecionada.status === "Pendentes"
                                            ? "PENDENTE"
                                            : solicitacaoSelecionada.status === "Aprovadas"
                                                ? "APROVADA"
                                                : "RECUSADA"}
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

                                <div className="detalhe-item">
                                    <span>Detalhes</span>
                                    <strong>
                                        {solicitacaoSelecionada.detalhe}
                                    </strong>
                                </div>

                                {solicitacaoSelecionada.data && (
                                    <div className="detalhe-item">
                                        <span>Data da solicitação</span>
                                        <strong>
                                            {solicitacaoSelecionada.data}
                                        </strong>
                                    </div>
                                )}

                            </div>

                            <div className="modal-acoes">
                                <button
                                    className="btn-cancelar"
                                    onClick={() => {
                                        setSolicitacaoSelecionada(null);
                                        setModalVisualizacao(false);
                                    }}
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