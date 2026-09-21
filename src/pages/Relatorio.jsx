import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { jsPDF } from "jspdf";
import autotable from "jspdf-autotable";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/relatorio.css";

function Relatorio() {
    const producaoRef = useRef(null);
    const statusRef = useRef(null);

    useEffect(() => {
        const producaoChart = new Chart(producaoRef.current, {
            type: "line",
            data: {
                labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                datasets: [
                    {
                        data: [120, 190, 150, 220, 180, 240],
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
                    y: { grid: { color: "#f1f5f9" }, ticks: { color: "#9ca3af" } },
                },
            },
        });

        const statusChart = new Chart(statusRef.current, {
            type: "doughnut",
            data: {
                labels: ["Pendentes", "Produção", "Concluídos"],
                datasets: [
                    {
                        data: [12, 8, 38],
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
    }, []);

    function downloadPDF() {
        const doc = new jsPDF();

        doc.setFillColor("#1f4e79");
        doc.rect(0, 0, 210, 30, "F");
        doc.setTextColor("#ffffff");
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Relatório de Produção", 105, 18, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Gerado em: " + new Date().toLocaleDateString(), 105, 28, { align: "center" });

        doc.setTextColor("#000000");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Resumo Geral", 20, 45);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        ["Produção Total: 245 peças", "Pedidos Concluídos: 38", "Pedidos Pendentes: 12", "Itens com Estoque Baixo: 4"]
            .forEach((linha, i) => doc.text(linha, 20, 55 + i * 7));

        autotable(doc, {
            startY: 90,
            head: [[{ content: "Mês", styles: { fillColor: "#1f4e79", textColor: 255 } },
                    { content: "Produção", styles: { fillColor: "#1f4e79", textColor: 255 } }]],
            body: [["Janeiro", 120], ["Fevereiro", 190], ["Março", 150], ["Abril", 220], ["Maio", 180], ["Junho", 240]],
            styles: { font: "helvetica", fontSize: 11, cellPadding: 4 },
            alternateRowStyles: { fillColor: "#f2f2f2" },
            headStyles: { halign: "center" },
            bodyStyles: { halign: "center" },
        });

        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setTextColor("#888888");
        doc.text("© 2026 E-threads - Todos os direitos reservados", 105, pageHeight - 10, { align: "center" });

        doc.save("relatorio-producao.pdf");
    }

    return (
        <>
            <Sidebar />

            <div className="container">

                <div className="top">
                    <div className="page-header">
                        <div className="page-title-row">
                            <h1 className="page-title">Relatórios</h1>
                        </div>
                        <p className="page-subtitle">Gerencie todos os Relatórios</p>
                    </div>

                    <button className="btn btn-add" onClick={downloadPDF}>
                        Baixar PDF
                    </button>
                </div>

                {/* CARDS RESUMO */}
                <div className="report-cards">

                    <div className="report-card">
                        <div className="card-top">
                            <span>Produção Total</span>
                            <div className="card-icon">
                                <span className="material-icons">insights</span>
                            </div>
                        </div>
                        <h2>245</h2>
                    </div>

                    <div className="report-card">
                        <div className="card-top">
                            <span>Pedidos Concluídos</span>
                            <div className="card-icon">
                                <span className="material-icons">check_circle</span>
                            </div>
                        </div>
                        <h2>38</h2>
                    </div>

                    <div className="report-card-baixo">
                        <div className="card-top">
                            <span>Itens em Estoque Baixo</span>
                            <div className="card-icon-baixo">
                                <span className="material-icons">warning</span>
                            </div>
                        </div>
                        <h2>4</h2>
                    </div>

                    <div className="report-card">
                        <div className="card-top">
                            <span>Pedidos Pendentes</span>
                            <div className="card-icon">
                                <span className="material-icons">receipt</span>
                            </div>
                        </div>
                        <h2>12</h2>
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