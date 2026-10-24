import "../styles/ficha-tecnica.css";
import { TAMANHOS } from "../utils/opcoesProduto";

function formatarGrade(grade = {}) {
    const itens = Object.entries(grade || {}).filter(([, q]) => Number(q) > 0);
    const total = itens.reduce((s, [, q]) => s + Number(q), 0);
    return { total };
}

// "2026-11-04" -> "04/11/2026" (sem new Date para evitar fuso horário)
function formatarData(texto) {
    if (!texto) return "";
    const [ano, mes, dia] = String(texto).slice(0, 10).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
}

function Campo({ rotulo, children, className = "" }) {
    return (
        <div className={`fc-campo ${className}`}>
            <strong>{rotulo}</strong>
            <div className="fc-campo-valor">{children || "—"}</div>
        </div>
    );
}

function CampoSe(props) {
    return props.children ? <Campo {...props} /> : null;
}

function FichaConteudo({ pedido, ficha, pedidoId = null, previewArtes = null }) {
    if (!pedido || !ficha) return null;

    const produtos = Array.isArray(pedido.produtos) ? pedido.produtos : [];

    return (
        <div className="fc-documento">

            {/* CABEÇALHO ÚNICO — aparece uma vez para o pedido inteiro */}
            <header className="fc-cabecalho-geral">
                <div className="fc-cab-esquerda">
                    <h1 className="fc-titulo-doc">
                        FICHA TÉCNICA — PEDIDO #{ficha.numero_pedido || "—"}
                    </h1>
                    <div className="fc-campos fc-cab-grid">
                        <Campo rotulo="Cliente">{ficha.cliente}</Campo>
                        <Campo rotulo="Data do pedido">{formatarData(ficha.dataPedido)}</Campo>
                        <Campo rotulo="Entrega">{formatarData(ficha.entrega)}</Campo>
                        <Campo rotulo="Prioridade">{ficha.prioridade}</Campo>
                        {ficha.colaborador && (
                            <Campo rotulo="Responsável">{ficha.colaborador}</Campo>
                        )}
                        {ficha.observacao && (
                            <Campo rotulo="Obs. gerais" className="fc-campo-full">
                                {ficha.observacao}
                            </Campo>
                        )}
                    </div>
                </div>

            </header>

            {/* SEÇÕES POR PRODUTO — cada produto na sua seção */}
            {produtos.map((produto, idx) => {
                const detalhes    = produto.detalhes || {};
                const grade       = produto.grade    || {};
                const { total }   = formatarGrade(grade);
                const nomeProduto = produto.item || `Produto ${idx + 1}`;
                // Arte: preview local antes do save ou URL da API após save
                const arteItem    = previewArtes?.[idx] || detalhes.imagem_url || null;

                return (
                    <section key={idx} className="fc-produto-secao">
                        <h2 className="fc-produto-titulo">
                            Produto {idx + 1} — {nomeProduto}
                        </h2>

                        <div className="fc-produto-corpo">
                            <div className="fc-produto-detalhes">
                                <div className="fc-campos fc-campos-produto">
                                    <CampoSe rotulo="Tecido">{detalhes.tecido}</CampoSe>
                                    <CampoSe rotulo="Cor">{detalhes.cor}</CampoSe>
                                    <CampoSe rotulo="Personalização">{detalhes.personalizacao}</CampoSe>
                                    <CampoSe rotulo="Local da arte">{detalhes.local}</CampoSe>
                                </div>

                                <div className="fc-grade">
                                    <div className="fc-grade-conteudo">
                                        <strong className="fc-grade-titulo">GRADE</strong>
                                        <div className="fc-tamanhos">
                                            {TAMANHOS.map(t => (
                                                <div key={t}>
                                                    <strong>{t}</strong>
                                                    <span>{grade[t] ?? ""}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <p className="fc-total-pecas">
                                    Total: {total} peça{total !== 1 ? "s" : ""}
                                </p>

                                {(detalhes.observacao || ficha.personalizacao) && (
                                    <div className="fc-produto-obs">
                                        <strong>OBSERVAÇÕES</strong>
                                        <p>
                                            {[
                                                detalhes.observacao   && `Item: ${detalhes.observacao}`,
                                                ficha.personalizacao  && `Personalização: ${ficha.personalizacao}`,
                                            ].filter(Boolean).join(" | ") || "—"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="fc-produto-arte">
                                <strong className="fc-rotulo">ARTE / CROQUI</strong>
                                <div className="fc-ilustracao-conteudo fc-ilustracao-produto">
                                    {arteItem ? (
                                        <img src={arteItem} alt={`Arte de ${nomeProduto}`} />
                                    ) : (
                                        <span className="fc-arte-vazia">
                                            Área reservada para a ilustração
                                        </span>
                                    )}
                                </div>

                                {/* QR Code individual do item */}
                                <div className="fc-item-qr">
                                    {detalhes.id ? (
                                        <>
                                            <img
                                                src={`/api/pedidos/itens/${detalhes.id}/qrcode`}
                                                alt={`QR Code — ${nomeProduto}`}
                                                className="fc-qr-img"
                                            />
                                            <span className="fc-qr-label">Escanear para ver item</span>
                                        </>
                                    ) : (
                                        <div className="fc-qr-pendente">
                                            QR Code<br />após finalizar
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })}

            {produtos.length === 0 && (
                <p className="fc-sem-produtos">Nenhum produto encontrado.</p>
            )}
        </div>
    );
}

export default FichaConteudo;
