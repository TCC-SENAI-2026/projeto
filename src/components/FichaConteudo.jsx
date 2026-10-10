import { QRCodeSVG } from "qrcode.react";
import "../styles/ficha-tecnica.css";

// Campos que o fluxo de pedido ainda NÃO coleta (modelo, segmento, fornecedor,
// composição e aviamentos). Enquanto isso, a ficha mostra estes valores de exemplo.
// Quando esses dados passarem a vir do pedido, é só apagar este bloco.
const EXEMPLO = {
    modelo: "CAMISA",
    segmento: "MASCULINO",
    fornecedor: "CATAGUASES",
    composicao: "100% ALGODÃO",
    aviamentos: [
        { nome: "BOT. 4 FUROS POLIÉSTER", qtd: "09", v1: "CRU",   v2: "AZUL CLARO", v3: "" },
        { nome: "ETIQUETA INT. DE GOLA",  qtd: "01", v1: "CRU",   v2: "MARINHO",    v3: "" },
        { nome: "ETIQ. DE COMPOSIÇÃO",    qtd: "01", v1: "ÚNICA", v2: "ÚNICA",      v3: "" },
        { nome: "ETIQUETA EXTERNA",       qtd: "01", v1: "CÁQUI", v2: "MARINHO",    v3: "" },
    ],
};

const PREFIXO_REFERENCIA = "INV";

// Ex.: { P: 2, M: 0, G: 3 } -> { texto: "P(2) G(3)", total: 5 }
function formatarGrade(grade = {}) {
    const itens = Object.entries(grade).filter(([, qtd]) => Number(qtd) > 0);
    const total = itens.reduce((acc, [, qtd]) => acc + Number(qtd), 0);
    const texto = itens.map(([tam, qtd]) => `${tam}(${qtd})`).join(" ");
    return { texto: texto || "—", total };
}

function FichaConteudo({ pedido, ficha }) {
    if (!pedido || !ficha) return null;

    const arteGeral = pedido.arte || null;
    const ano = new Date().getFullYear();

    return (
        <div className="fc-scroll">
            <div className="fc-lista">
                {pedido.produtos?.map((produto, idx) => {
                    const d = produto.detalhes || {};
                    const { texto: gradeTexto, total } = formatarGrade(produto.grade);
                    const arteItem = produto.arte || arteGeral || null;
                    const aviamentos = d.aviamentos || EXEMPLO.aviamentos;

                    // QR só quando a foto é uma URL (uma imagem em base64 é grande demais para um QR)
                    const qrValue =
                        produto.fotoUrl && !produto.fotoUrl.startsWith("data:")
                            ? produto.fotoUrl
                            : null;

                    return (
                        <div key={idx} className="fc-ficha">

                            {/* 1. CABEÇALHO */}
                            <div className="fc-titulo">
                                <span className="fc-titulo-texto">FICHA TÉCNICA</span>
                            </div>
                            <div className="fc-ref">
                                <span className="fc-ref-texto">
                                    REFERÊNCIA: {ficha.referencia || `${PREFIXO_REFERENCIA} ${ano}/${idx + 1}`}
                                </span>
                            </div>

                            {/* 2. ILUSTRAÇÃO / ARTE */}
                            <div className="fc-arte">
                                {arteItem ? (
                                    <img className="fc-arte-img" src={arteItem} alt="Arte do item" />
                                ) : (
                                    <div className="fc-arte-vazia">
                                        <span className="material-icons">draw</span>
                                        <p>ILUSTRAÇÃO / CROQUI DA PEÇA</p>
                                    </div>
                                )}

                                {qrValue && (
                                    <div className="fc-qr">
                                        <QRCodeSVG value={qrValue} size={56} bgColor="#ffffff" fgColor="#000000" level="M" />
                                        <span>FOTO DA PEÇA</span>
                                    </div>
                                )}
                            </div>

                            {/* 3. INFORMAÇÕES */}
                            <div className="fc-info">
                                <div className="fc-info-bloco">
                                    <p className="fc-linha"><strong>NOME DO PRODUTO:</strong> {produto.item || "—"}</p>
                                    <p className="fc-linha"><strong>MODELO:</strong> {d.modelo || EXEMPLO.modelo}</p>
                                    <p className="fc-linha"><strong>SEGMENTO:</strong> {d.segmento || EXEMPLO.segmento}</p>
                                    <p className="fc-linha"><strong>GRADE:</strong> {gradeTexto}</p>
                                    {total > 0 && (
                                        <p className="fc-linha"><strong>TOTAL:</strong> {total} PEÇAS</p>
                                    )}
                                    <p className="fc-linha"><strong>VARIANTES:</strong> {d.cor || "—"}</p>
                                    {d.personalizacao && (
                                        <p className="fc-linha"><strong>PERSONALIZAÇÃO:</strong> {d.personalizacao}</p>
                                    )}
                                    {d.local && (
                                        <p className="fc-linha"><strong>LOCAL DA ARTE:</strong> {d.local}</p>
                                    )}
                                </div>

                                <div className="fc-info-bloco">
                                    <p className="fc-info-titulo">TECIDOS:</p>
                                    <p className="fc-linha"><strong>NOME:</strong> {d.tecido || "—"}</p>
                                    <p className="fc-linha"><strong>FORNECEDOR:</strong> {d.fornecedor || EXEMPLO.fornecedor}</p>
                                    <p className="fc-linha"><strong>COMPOSIÇÃO:</strong> {d.composicao || EXEMPLO.composicao}</p>
                                </div>

                                <div className="fc-info-bloco">
                                    <p className="fc-linha"><strong>NOME:</strong> ENTRE TELA</p>
                                    <p className="fc-linha"><strong>FORNECEDOR:</strong> —</p>
                                    <p className="fc-linha"><strong>COMPOSIÇÃO:</strong> —</p>
                                </div>
                            </div>

                            {/* 4. AVIAMENTOS */}
                            <div className="fc-aviamentos">
                                <table className="fc-tabela">
                                    <thead>
                                        <tr>
                                            <th>AVIAMENTOS:</th>
                                            <th>QUANT.</th>
                                            <th>VARIANTE 1</th>
                                            <th>VARIANTE 2</th>
                                            <th>VARIANTE 3</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aviamentos.map((a, i) => (
                                            <tr key={i}>
                                                <td>{a.nome}</td>
                                                <td>{a.qtd}</td>
                                                <td>{a.v1}</td>
                                                <td>{a.v2}</td>
                                                <td>{a.v3}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 5. OBSERVAÇÕES */}
                            <div className="fc-obs">
                                <p className="fc-info-titulo">OBSERVAÇÕES:</p>
                                <p>{d.observacao || ficha.observacao || "—"}</p>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FichaConteudo;
