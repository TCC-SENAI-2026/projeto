import { QRCodeSVG } from "qrcode.react";
import "../styles/ficha-tecnica.css";
import { TAMANHOS } from "../utils/opcoesProduto";


function formatarGrade(grade = {}) {
    const itens = Object.entries(grade || {}).filter(
        ([, quantidade]) => Number(quantidade) > 0
    );

    const total = itens.reduce(
        (soma, [, quantidade]) => soma + Number(quantidade),
        0
    );

    return {
        texto:
            itens
                .map(([tamanho, quantidade]) => `${tamanho} (${quantidade})`)
                .join(" ") || "—",
        total,
    };
}

// "2026-11-04" -> "04/11/2026" (sem new Date, que erra o dia no Brasil)
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

function TabelaVazia({ tipo, colunas, linhas = 4, total = false }) {
    return (
        <section className={`fc-tabela-secao fc-${tipo}`}>
            <h3>{tipo === "materiais" ? "MATERIAIS" : "PROCESSOS"}</h3>

            <table className="fc-tabela">
                <thead>
                    <tr>
                        {colunas.map((coluna) => (
                            <th key={coluna}>{coluna}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {Array.from({ length: linhas }, (_, linha) => (
                        <tr key={linha}>
                            {colunas.map((coluna) => (
                                <td key={coluna}>&nbsp;</td>
                            ))}
                        </tr>
                    ))}
                </tbody>

                {total && (
                    <tfoot>
                        <tr>
                            <td colSpan={colunas.length - 1}>
                                Total R$
                            </td>
                            <td>&nbsp;</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </section>
    );
}

function FichaConteudo({ pedido, ficha }) {
    if (!pedido || !ficha) return null;

    const produtos = Array.isArray(pedido.produtos)
        ? pedido.produtos
        : [];

    const totalFichas = produtos.length;
    const arteGeral = pedido.arte || null;


    return (
        <div className="fc-scroll">
            <div className="fc-lista">
                {produtos.map((produto, idx) => {
                    const detalhes = produto.detalhes || {};
                    const grade = produto.grade || {};
                    const { total } = formatarGrade(grade);
                    const materiais = Array.isArray(detalhes.materiais) ? detalhes.materiais : [];
                    const processos = Array.isArray(detalhes.processos) ? detalhes.processos : [];

                    const arteItem = produto.arte || arteGeral;

                    // TODO(BACK): detalhes.aviamentos deve vir do pedido (nome, qtd, v1, v2, v3)

                    const aviamentos = Array.isArray(detalhes.aviamentos)
                        ? detalhes.aviamentos
                        : [];

                    // TODO(BACK): fotoUrl deve ser uma URL http(s) devolvida pelo upload (gera o QR Code)
                    const fotoUrl =
                        typeof produto.fotoUrl === "string"
                            ? produto.fotoUrl.trim()
                            : "";

                    const qrValue = /^https?:\/\//i.test(fotoUrl)
                        ? fotoUrl
                        : null;


                    // TODO(BACK): o back deve gerar e guardar ficha.referencia
                    // (hoje cai em "INV {ano atual}/{nº}", que muda a cada ano)
                    const referencia = ficha.referencia || "";

                    const nomeProduto =
                        produto.item || `Produto ${idx + 1}`;

                    return (

                        <article
                            className="fc-ficha"
                            key={produto.id ?? idx}
                        >
                            {/* CABEÇALHO DA FICHA */}
                            <header className="fc-cabecalho">
                                <span>FICHA TÉCNICA</span>

                                <div className={`fc-identificacao-ficha ${idx === 0 ? "fc-primeira-identificacao" : "fc-outra-identificacao"}`}>
                                    <span className="fc-numero-ficha">
                                        FICHA {idx + 1} DE {totalFichas}
                                    </span>

                                    <span className="fc-produto-identificacao">
                                        {nomeProduto}
                                    </span>
                                </div>
                            </header>



                            {/* IDENTIFICAÇÃO E GRADE */}
                            <section className="fc-identificacao">
                                <div className="fc-campos">
                                    <Campo rotulo="Descrição">{nomeProduto}</Campo>
                                    <CampoSe rotulo="Referência">{referencia}</CampoSe>
                                    <Campo rotulo="Cliente">{ficha.cliente}</Campo>
                                    <Campo rotulo="Data do pedido">{formatarData(ficha.dataPedido)}</Campo>
                                    <Campo rotulo="Entrega">{formatarData(ficha.entrega)}</Campo>
                                    <CampoSe rotulo="Coleção">{detalhes.colecao}</CampoSe>
                                    <CampoSe rotulo="Responsável">{detalhes.responsavel}</CampoSe>
                                </div>

                                <div className="fc-grade">
                                    <div className="fc-grade-conteudo">
                                        <strong className="fc-grade-titulo">
                                            GRADE
                                        </strong>

                                        <div className="fc-tamanhos">
                                            {TAMANHOS.map(
                                                (tamanho) => (
                                                    <div key={tamanho}>
                                                        <strong>
                                                            {tamanho}
                                                        </strong>

                                                        <span>
                                                            {grade[tamanho] ?? ""}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="fc-variantes">
                                        <strong>VARIANTES</strong>
                                        <span>{detalhes.cor || "—"}</span>
                                    </div>
                                </div>
                            </section>

                            {/* ILUSTRAÇÃO E INFORMAÇÕES */}
                            <section className="fc-area-central">
                                <div className="fc-ilustracao">
                                    <strong className="fc-rotulo">
                                        ILUSTRAÇÃO / CROQUI DA PEÇA
                                    </strong>

                                    <div className="fc-ilustracao-conteudo">
                                        {arteItem ? (
                                            <img
                                                src={arteItem}
                                                alt={`Arte de ${nomeProduto}`}
                                            />
                                        ) : (
                                            <span className="fc-arte-vazia">
                                                Área reservada para a ilustração
                                            </span>
                                        )}
                                    </div>

                                    {/* QR CODE */}
                                    <div className="fc-qr">
                                        {qrValue ? (
                                            <QRCodeSVG
                                                value={qrValue}
                                                size={76}
                                                bgColor="#ffffff"
                                                fgColor="#000000"
                                                level="M"
                                                marginSize={1}
                                            />
                                        ) : (
                                            <div
                                                className="fc-qr-vazio"
                                                aria-label="QR Code indisponível"
                                            >
                                                <span>QR</span>
                                            </div>
                                        )}

                                        <span>
                                            {qrValue
                                                ? "FOTO DA PEÇA"
                                                : "FOTO SEM URL"}
                                        </span>
                                    </div>
                                </div>

                                <div className="fc-detalhes">
                                    <h3>INFORMAÇÕES DO PRODUTO</h3>

                                    <CampoSe rotulo="Modelo">{detalhes.modelo}</CampoSe>
                                    <CampoSe rotulo="Segmento">{detalhes.segmento}</CampoSe>
                                    <Campo rotulo="Quantidade total">
                                        {total > 0 ? `${total} peças` : ""}
                                    </Campo>
                                    <CampoSe rotulo="Personalização">{detalhes.personalizacao}</CampoSe>
                                    <CampoSe rotulo="Local da arte">{detalhes.local}</CampoSe>

                                    <h3>TECIDOS</h3>

                                    <CampoSe rotulo="Nome">{detalhes.tecido}</CampoSe>
                                    <CampoSe rotulo="Fornecedor">{detalhes.fornecedor}</CampoSe>
                                    <CampoSe rotulo="Composição">{detalhes.composicao}</CampoSe>
                                </div>
                            </section>

                            {/* AVIAMENTOS */}
                            {aviamentos.length > 0 && (
                                <section className="fc-tabela-secao fc-aviamentos">
                                    <h3>AVIAMENTOS</h3>

                                    <table className="fc-tabela">
                                        <thead>
                                            <tr>
                                                <th>Descrição</th>
                                                <th>Quantidade</th>
                                                <th>Variante 1</th>
                                                <th>Variante 2</th>
                                                <th>Variante 3</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {aviamentos.map((aviamento, i) => (
                                                <tr key={i}>
                                                    <td>{aviamento.nome}</td>
                                                    <td>{aviamento.qtd}</td>
                                                    <td>{aviamento.v1}</td>
                                                    <td>{aviamento.v2}</td>
                                                    <td>{aviamento.v3}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            )}

                            {/* TODO(BACK): materiais[] com custos (hoje é tabela em branco) */}

                            {/* MATERIAIS */}
                            {materiais.length > 0 && (
                                <TabelaVazia
                                    tipo="materiais"
                                    colunas={[
                                        "Referência",
                                        "Descrição",
                                        "Responsável",
                                        "Observação",
                                        "Quantidade",
                                        "UM",
                                        "Custo unitário",
                                        "Custo de produção",
                                    ]}
                                    linhas={4}
                                    total
                                />

                            )}
                            {/* TODO(BACK): processos[] com custos (hoje é tabela em branco) */}

                            {/* PROCESSOS */}
                            {processos.length > 0 && (
                                <TabelaVazia
                                    tipo="processos"
                                    colunas={[
                                        "Referência",
                                        "Descrição",
                                        "Responsável",
                                        "Custo de produção",
                                    ]}
                                    linhas={4}
                                    total
                                />
                            )}
                            {/* OBSERVAÇÕES */}
                            <section className="fc-observacoes">
                                <strong>OBSERVAÇÕES</strong>
                                <p>
                                    {[
                                        detalhes.observacao && `Item: ${detalhes.observacao}`,
                                        ficha.personalizacao && `Personalização: ${ficha.personalizacao}`,
                                        ficha.observacao && `Gerais: ${ficha.observacao}`,
                                    ].filter(Boolean).join("\n") || "—"}
                                </p>
                            </section>
                        </article>
                    );
                })}

                {produtos.length === 0 && (
                    <p className="fc-sem-produtos">
                        Nenhum produto foi encontrado neste pedido.
                    </p>
                )}
            </div>
        </div>
    );
}

export default FichaConteudo;