import "../styles/solicitacoes.css";

/**
 * Avisos no topo da seção:
 *  - mensagem: texto temporário ("Solicitação enviada para o adm."), some sozinho
 *  - resultados: respostas do adm (aprovada/recusada), ficam até o funcionário fechar
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
                const exclusao = s.tipo === "exclusao";
                const textoAprovada = exclusao
                    ? "o pedido foi excluído."
                    : "suas alterações foram aprovadas.";
                const textoRecusada = exclusao
                    ? "a exclusão do pedido foi recusada."
                    : "sua solicitação foi recusada.";
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
                            <strong>Pedido #{s.pedidoId}:</strong>{" "}
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