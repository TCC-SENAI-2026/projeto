import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { gerarRelatorioProducao, carregarLogoRelatorio } from "../services/gerar_relatorio_producao";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";
import "../styles/padrao.css";
import "../styles/Relatorio.css";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function Relatorio() {
    const producaoRef = useRef(null);
    const statusRef = useRef(null);

    const [relatorio, setRelatorio] = useState(null);
    const [erro, setErro] = useState("");
    const [gerandoPDF, setGerandoPDF] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            api.get('/relatorios/resumo', { signal: controller.signal }),
            api.get('/relatorios/producao-mensal', { signal: controller.signal }),
        ]).then(([resumo, producao]) => {
            if (!controller.signal.aborted) {
                setRelatorio({ ...resumo.data, producao: producao.data.meses });
            }
        }).catch((error) => {
            if (!controller.signal.aborted) setErro(error.message);
        });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!relatorio) return;
        const producaoChart = new Chart(producaoRef.current, {
            type: "line",
            data: {
                labels: relatorio.producao.map(({ mes }) => MESES[mes - 1].slice(0, 3)),
                datasets: [
                    {
                        data: relatorio.producao.map(({ total }) => total),
                        borderColor: "#6366f1",
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointBackgroundColor: "#fff",
                        pointBorderColor: "#6366f1",
                        pointBorderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: "#9ca3af" } },
                    y: {
                        beginAtZero: true,
                        suggestedMax: 100,
                        grid: { color: "#f1f5f9" },
                        ticks: { color: "#9ca3af", stepSize: 100, precision: 0 },
                    },
                },
            },
        });

        const statusChart = new Chart(statusRef.current, {
            type: "doughnut",
            data: {
                labels: ["Pendentes", "Produção", "Concluídos"],
                datasets: [
                    {
                        data: [relatorio.pedidos_pendentes, relatorio.pedidos_em_producao, relatorio.pedidos_concluidos_total],
                        backgroundColor: ["#151e31", "#4400ff", "#b3c0d75c"],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: {
                        position: "right",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 20,
                            color: "#374151",
                            font: { size: 14 },
                        },
                    },
                },
            },
        });

        return () => {
            producaoChart.destroy();
            statusChart.destroy();
        };
    }, [relatorio]);

    async function downloadPDF() {
        if (!relatorio || gerandoPDF) return;
        setGerandoPDF(true);
        setErro('');
        try {
            const logo = await carregarLogoRelatorio();
            const { doc, nomeArquivo } = gerarRelatorioProducao(relatorio, { logo });
            doc.save(nomeArquivo);
        } catch (error) {
            setErro(error.message || 'Falha ao gerar o PDF. Tente novamente.');
        } finally {
            setGerandoPDF(false);
        }
    }

    const mesAtual = (relatorio ? new Date(relatorio.ano, relatorio.mes - 1, 1) : new Date()).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());

    return (
        <>
            <Sidebar />

            <div className="container">

                <div className="top">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">Relatórios</h1>
                        </div>
                        <p className="page-subtitle">Estatísticas de {mesAtual}</p>
                    </div>

                    <button className="btn btn-add" onClick={downloadPDF} disabled={!relatorio || gerandoPDF}>
                        {gerandoPDF ? "Gerando PDF..." : "Baixar PDF"}
                    </button>
                </div>

                {erro && <p role="alert">Não foi possível carregar os relatórios: {erro}</p>}

                {/* CARDS RESUMO */}
                <div className="report-cards">

                    <div className="report-card">
                        <div className="card-top">
                            <span>Produção Total</span>
                            <div className="card-icon">
                                <span className="material-icons">insights</span>
                            </div>
                        </div>
                        <h2>{relatorio ? relatorio.producao_total : "—"}</h2>
                    </div>

                    <div className="report-card">
                        <div className="card-top">
                            <span>Pedidos Concluídos</span>
                            <div className="card-icon">
                                <span className="material-icons">check_circle</span>
                            </div>
                        </div>
                        <h2>{relatorio ? relatorio.pedidos_concluidos : "—"}</h2>
                    </div>

                    <div className="report-card-baixo">
                        <div className="card-top">
                            <span>Itens em Estoque Baixo</span>
                            <div className="card-icon-baixo">
                                <span className="material-icons">warning</span>
                            </div>
                        </div>
                        <h2>{relatorio ? relatorio.estoque_baixo : "—"}</h2>
                    </div>

                    <div className="report-card">
                        <div className="card-top">
                            <span>Pedidos Pendentes</span>
                            <div className="card-icon">
                                <span className="material-icons">receipt</span>
                            </div>
                        </div>
                        <h2>{relatorio ? relatorio.pedidos_pendentes : "—"}</h2>
                    </div>

                </div>

                {/* GRÁFICOS */}
                <div className="charts">

                    <div className="chart-box">
                        <h3>Produção por Mês</h3>
                        <div className="chart-area">
                            <div className="produc-area">
                                <canvas ref={producaoRef}></canvas>
                            </div>
                        </div>
                    </div>

                    <div className="chart-box">
                        <h3>Status dos Pedidos</h3>
                        <div className="chart-area">
                            <div className="donut-area">
                                <canvas ref={statusRef}></canvas>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}

export default Relatorio;
