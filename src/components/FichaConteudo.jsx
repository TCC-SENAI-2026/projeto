import React from "react";

function processarGrade(grade = {}) {
    const total = Object.values(grade).reduce((acc, v) => acc + (Number(v) || 0), 0);
    const formatoGrade = Object.entries(grade)
        .filter(([, qtd]) => Number(qtd) > 0)
        .map(([tam, qtd]) => `${tam}(${qtd})`)
        .join(" ");

    return { grade, total, formatoGrade: formatoGrade || "P(0) M(0) G(0)" };
}

function FichaConteudo({ pedido, ficha }) {
    if (!pedido || !ficha) return null;

    const arteGeral = pedido.arte || null;

    const s = {
        /* CONTAINER PRINCIPAL DA FICHA COM SCROLL FORÇADO */
        scrollBox: {
            maxHeight: "500px",          // Defina a altura máxima desejada (ex: 500px ou 60vh)
            overflowY: "auto",           // Força a barra de rolagem vertical
            overflowX: "hidden",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "12px",
            backgroundColor: "#ffffff",
            boxSizing: "border-box"
        },
        wrapper: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            backgroundColor: "#ffffff",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#000000",
            boxSizing: "border-box"
        },
        gridContainer: {
            display: "grid",
            gridTemplateColumns: "60% 40%",
            border: "2px solid #000000",
            backgroundColor: "#ffffff",
            boxSizing: "border-box"
        },
        headerTitle: {
            gridColumn: "1 / 2",
            borderRight: "2px solid #000000",
            borderBottom: "2px solid #000000",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box"
        },
        headerTitleH1: {
            fontSize: "20px",
            fontWeight: "900",
            margin: 0,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#000000"
        },
        headerRef: {
            gridColumn: "2 / 3",
            borderBottom: "2px solid #000000",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#ffffff",
            boxSizing: "border-box"
        },
        headerRefH2: {
            fontSize: "14px",
            fontWeight: "900",
            margin: 0,
            textTransform: "uppercase",
            color: "#000000"
        },
        bodyArte: {
            gridColumn: "1 / 2",
            borderRight: "2px solid #000000",
            borderBottom: "2px solid #000000",
            padding: "16px",
            minHeight: "260px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            boxSizing: "border-box"
        },
        arteImg: {
            maxWidth: "100%",
            maxHeight: "250px",
            objectFit: "contain"
        },
        bodyInfo: {
            gridColumn: "2 / 3",
            borderBottom: "2px solid #000000",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box"
        },
        infoSection: {
            padding: "8px 12px",
            fontSize: "11px",
            lineHeight: "1.5",
            color: "#000000"
        },
        infoSectionBorderTop: {
            borderTop: "1px solid #000000",
            padding: "8px 12px",
            fontSize: "11px",
            lineHeight: "1.5",
            color: "#000000"
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            borderSpacing: 0,
            fontSize: "10px",
            color: "#000000"
        },
        thTd: {
            borderRight: "1px solid #000000",
            borderBottom: "1px solid #000000",
            borderTop: "none",
            borderLeft: "none",
            padding: "4px 6px",
            textAlign: "center",
            height: "22px",
            color: "#000000",
            boxSizing: "border-box"
        },
        thTdLastCol: {
            borderRight: "none",
            borderBottom: "1px solid #000000",
            borderTop: "none",
            borderLeft: "none",
            padding: "4px 6px",
            textAlign: "center",
            height: "22px",
            color: "#000000",
            boxSizing: "border-box"
        },
        tdLeft: {
            textAlign: "left",
            fontWeight: "700"
        },
        footerAviamentos: {
            gridColumn: "1 / 2",
            borderRight: "2px solid #000000",
            boxSizing: "border-box"
        },
        footerObs: {
            gridColumn: "2 / 3",
            padding: "8px 10px",
            fontSize: "10px",
            lineHeight: "1.4",
            display: "flex",
            flexDirection: "column",
            color: "#000000",
            boxSizing: "border-box"
        }
    };

    return (
        <div style={s.scrollBox} className="ficha-scroll-box">
            <div style={s.wrapper}>
                {pedido.produtos?.map((produto, idx) => {
                    const { formatoGrade } = processarGrade(produto.grade);
                    const arteItem = produto.arte || arteGeral || null;

                    return (
                        <div key={idx} style={s.gridContainer}>
                            
                            {/* 1. CABEÇALHO */}
                            <div style={s.headerTitle}>
                                <h1 style={s.headerTitleH1}>FICHA TÉCNICA</h1>
                            </div>
                            <div style={s.headerRef}>
                                <h2 style={s.headerRefH2}>
                                    REFERÊNCIA: {ficha.referencia || `INV 2026/${idx + 1}`}
                                </h2>
                            </div>

                            {/* 2. ÁREA CENTRAL ESQUERDA: ILUSTRAÇÃO */}
                            <div style={s.bodyArte}>
                                {arteItem ? (
                                    <img src={arteItem} alt="Desenho Técnico" style={s.arteImg} />
                                ) : (
                                    <div style={{ textAlign: "center", color: "#a1a1aa" }}>
                                        <span className="material-icons" style={{ fontSize: "56px" }}>draw</span>
                                        <p style={{ fontSize: "11px", fontWeight: "800", marginTop: "6px" }}>
                                            ILUSTRAÇÃO / CROQUI DA PEÇA
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 3. ÁREA CENTRAL DIREITA: INFORMAÇÕES */}
                            <div style={s.bodyInfo}>
                                <div style={s.infoSection}>
                                    <p style={{ margin: "2px 0" }}><strong>NOME DO PRODUTO:</strong> {produto.item ? produto.item.toUpperCase() : "CAMISA MASCULINA"}</p>
                                    <p style={{ margin: "2px 0" }}><strong>MODELO:</strong> {produto.detalhes?.modelo || "CAMISA"}</p>
                                    <p style={{ margin: "2px 0" }}><strong>SEGMENTO:</strong> {produto.detalhes?.segmento || "MASCULINO"}</p>
                                    <p style={{ margin: "2px 0" }}><strong>GRADE:</strong> {formatoGrade}</p>
                                    <p style={{ margin: "2px 0" }}><strong>VARIANTES:</strong> {produto.detalhes?.cor || "1165, 1001"}</p>

                                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                                        <div style={{ width: "30px", height: "30px", border: "1px solid #000", backgroundColor: "#fef08a" }} />
                                        <div style={{ width: "30px", height: "30px", border: "1px solid #000", backgroundColor: "#bae6fd" }} />
                                    </div>
                                </div>

                                <div style={s.infoSectionBorderTop}>
                                    <p style={{ fontWeight: "900", margin: "0 0 4px 0" }}>TECIDOS:</p>
                                    <p style={{ margin: "2px 0" }}><strong>NOME:</strong> {produto.detalhes?.tecido || "CHAMBRAY / TF 1576"}</p>
                                    <p style={{ margin: "2px 0" }}><strong>FORNECEDOR:</strong> {produto.detalhes?.fornecedor || "CATAGUASES"}</p>
                                    <p style={{ margin: "2px 0" }}><strong>COMPOSIÇÃO:</strong> {produto.detalhes?.composicao || "100% ALGODÃO"}</p>
                                </div>

                                <div style={s.infoSectionBorderTop}>
                                    <p style={{ margin: "2px 0" }}><strong>NOME:</strong> ENTRE TELA</p>
                                    <p style={{ margin: "2px 0" }}><strong>FORNECEDOR:</strong> —</p>
                                    <p style={{ margin: "2px 0" }}><strong>COMPOSIÇÃO:</strong> —</p>
                                </div>
                            </div>

                            {/* 4. RODAPÉ ESQUERDO: TABELA DE AVIAMENTOS */}
                            <div style={s.footerAviamentos}>
                                <table style={s.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...s.thTd, ...s.tdLeft, fontWeight: "800" }}>AVIAMENTOS:</th>
                                            <th style={{ ...s.thTd, fontWeight: "800" }}>QUANT.</th>
                                            <th style={{ ...s.thTd, fontWeight: "800" }}>VARIANTE 1</th>
                                            <th style={{ ...s.thTd, fontWeight: "800" }}>VARIANTE 2</th>
                                            <th style={{ ...s.thTdLastCol, fontWeight: "800" }}>VARIANTE 3</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ ...s.thTd, ...s.tdLeft }}>BOT. 4 FUROS POLIÉSTER</td>
                                            <td style={s.thTd}>09</td>
                                            <td style={s.thTd}>CRU</td>
                                            <td style={s.thTd}>AZUL CLARO</td>
                                            <td style={s.thTdLastCol}></td>
                                        </tr>
                                        <tr>
                                            <td style={{ ...s.thTd, ...s.tdLeft }}>ETIQUETA INT. DE GOLA</td>
                                            <td style={s.thTd}>01</td>
                                            <td style={s.thTd}>CRU</td>
                                            <td style={s.thTd}>MARINHO</td>
                                            <td style={s.thTdLastCol}></td>
                                        </tr>
                                        <tr>
                                            <td style={{ ...s.thTd, ...s.tdLeft }}>ETIQ. DE COMPOSIÇÃO</td>
                                            <td style={s.thTd}>01</td>
                                            <td style={s.thTd}>ÚNICA</td>
                                            <td style={s.thTd}>ÚNICA</td>
                                            <td style={s.thTdLastCol}></td>
                                        </tr>
                                        <tr>
                                            <td style={{ ...s.thTd, ...s.tdLeft, borderBottom: "none" }}>ETIQUETA EXTERNA</td>
                                            <td style={{ ...s.thTd, borderBottom: "none" }}>01</td>
                                            <td style={{ ...s.thTd, borderBottom: "none" }}>CÁQUI</td>
                                            <td style={{ ...s.thTd, borderBottom: "none" }}>MARINHO</td>
                                            <td style={{ ...s.thTdLastCol, borderBottom: "none" }}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* 5. RODAPÉ DIREITO: OBSERVAÇÕES */}
                            <div style={s.footerObs}>
                                <p style={{ fontWeight: "900", margin: "0 0 4px 0" }}>OBSERVAÇÕES:</p>
                                <p style={{ margin: 0, textTransform: "uppercase" }}>
                                    {produto.detalhes?.observacao || ficha.observacao || "A PEÇA SOFRE LAVAGEM LEVE COM AMACIADO."}
                                </p>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FichaConteudo;