import "../styles/solicitacoes.css";

/**
 * Avisos no topo da seção:
 *  - mensagem: texto temporário ("Solicitação enviada para o adm."), some sozinho
 *  - resultados: respostas temporárias do adm, com expiração controlada pelo hook
 */
function AvisoTopo({ mensagem, resultados = [], onFecharResultado }) {
    if (!mensagem && resultados.length === 0) return null;

    return (
        <div className="aviso-topo-area">
            {mensagem && (
                <div className="aviso-topo aviso-sucesso" role="status">
                    <span className="material-icons">check_circle</span>
                    <span>{mensagem}</span>
                </div>
            )}

            {resultados.map((s) => {
                const aprovada = s.status === "aprovada";
                const perfil = s.tipo === "perfil";
                const exclusao = s.tipo === "exclusao";
                const cliente = Boolean(s.clienteId);
                const estoque = Boolean(s.estoqueId);
                const textoAprovada = cliente
                    ? (s.reativar ? "a reativação foi aprovada." : "a inativação foi aprovada.")
                    : estoque ? (s.reativar ? "a reativação do item foi aprovada." : "a exclusão do item foi aprovada.") : exclusao
                    ? "o pedido foi excluído."
                    : "suas alterações foram aprovadas.";
                const textoRecusada = cliente || estoque ? "sua solicitação foi recusada." : exclusao
                    ? "a exclusão do pedido foi recusada."
                    : "sua solicitação foi recusada.";
                const rotulo = perfil ? (s.resumo || "Alteração de perfil")
                    : cliente ? `Cliente: ${s.resumo || `#${s.clienteId}`}`
                    : estoque ? `Estoque: ${s.resumo || `#${s.estoqueId}`}`
                    : s.pedidoId != null ? `Pedido #${s.pedidoId}` : "Solicitação";
                return (
                    <div
                        key={s.id}
                        className={`aviso-topo ${aprovada ? "aviso-sucesso" : "aviso-erro"}`}
                        role="status"
                    >
                        <span className="material-icons">
                            {aprovada ? "check_circle" : "cancel"}
                        </span>

                        <span className="aviso-texto">
                            <strong>{rotulo}:</strong>{" "}
                            {aprovada ? textoAprovada : textoRecusada}
                            {!aprovada && s.motivo && <> Motivo: {s.motivo}</>}
                        </span>

                        <button
                            type="button"
                            className="aviso-fechar"
                            onClick={() => onFecharResultado(s.id)}
                            aria-label="Fechar aviso"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default AvisoTopo;
