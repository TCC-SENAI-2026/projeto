// graficos


// pdf

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Relatório de Produção", 20, 20);

    doc.setFontSize(10);
    doc.text("Gerado em: " + new Date().toLocaleDateString(), 20, 28);

    doc.setFontSize(14);
    doc.text("Resumo Geral", 20, 45);

    doc.setFontSize(11);
    doc.text("Produção Total: 245 peças", 20, 55);
    doc.text("Pedidos Concluídos: 38", 20, 62);
    doc.text("Pedidos Pendentes: 12", 20, 69);
    doc.text("Itens com Estoque Baixo: 4", 20, 76);

    doc.autoTable({
        startY: 90,
        head: [["Mês", "Produção"]],
        body: [
            ["Janeiro", 120],
            ["Fevereiro", 190],
            ["Março", 150],
            ["Abril", 220],
            ["Maio", 180],
            ["Junho", 240]
        ]
    });

    doc.save("relatorio-producao.pdf");
}

// funcoes gerais

function abrirPedido(id) {
    window.location.href = `pedido-detalhe.html?id=${id}`;
}

function confirmarExclusao(id) {
    const confirmar = window.confirm(`Deseja realmente excluir o pedido #${id}?`);

    if (confirmar) {
        alert(`Pedido #${id} excluído com sucesso.`);
    }
}

function abrirItemEstoque(id) {
    window.location.href = `item-estoque.html?id=${id}`;
}

function abrirModalCliente() {
    const modal = document.getElementById("clienteModal");
    if (modal) {
        modal.classList.add("active");
    }
}

function fecharModalCliente() {
    const modal = document.getElementById("clienteModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function fecharModalFuncionario() {
    const modal = document.getElementById("funcionarioModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

// abas gerais das páginas

function openTab(tabId, el) {
    const tabs = document.querySelectorAll(".tab-content");
    const buttons = document.querySelectorAll(".tab-btn");

    tabs.forEach(tab => tab.classList.remove("active"));
    buttons.forEach(btn => btn.classList.remove("active"));

    const currentTab = document.getElementById(tabId);
    if (currentTab) {
        currentTab.classList.add("active");
    }

    if (el) {
        el.classList.add("active");
    }

    const contadorEstoque = document.querySelector(".page-count");
    const itensEstoque = document.querySelectorAll(`#${tabId} .estoque-row`);

    if (contadorEstoque && document.querySelector(".estoque-row")) {
        contadorEstoque.textContent = `(${itensEstoque.length})`;
    }
}

// contador

function atualizarContadorPedidos() {
    const pedidos = document.querySelectorAll("#recentes .product");
    const contador = document.querySelector(".page-count");

    if (contador && document.querySelector("#recentes")) {
        contador.textContent = `(${pedidos.length})`;
    }
}

function atualizarContadorEstoque(tabId = "produtos") {
    const itens = document.querySelectorAll(`#${tabId} .estoque-row`);
    const contador = document.querySelector(".page-count");

    if (contador && document.querySelector(".estoque-row")) {
        contador.textContent = `(${itens.length})`;
    }
}

function atualizarContadorClientes() {
    const clientes = document.querySelectorAll(".client-card");
    const contador = document.getElementById("client-count");

    if (contador) {
        contador.textContent = clientes.length;
    }
}

function atualizarContadorFuncionarios() {
    const funcionarios = document.querySelectorAll(".funcionario-card");
    const contador = document.getElementById("funcionario-count");

    if (contador) {
        contador.textContent = funcionarios.length;
    }
}

// variáveis globais
let clienteSelecionadoId = null;
let funcionarioSelecionadoId = null;

// inicialização

document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll(".menu a, .submenu a");

    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("ativo");
        }
    });

    if (document.querySelector("#recentes")) {
        atualizarContadorPedidos();
    }

    if (document.querySelector(".estoque-row")) {
        atualizarContadorEstoque("produtos");
    }

    if (document.querySelector(".client-card")) {
        atualizarContadorClientes();
    }

    if (document.querySelector(".funcionario-card")) {
        atualizarContadorFuncionarios();
    }

    // Modal de clientes
    const cards = document.querySelectorAll(".client-card");
    const modal = document.getElementById("clienteModal");

    const campoEmpresa = document.querySelector('[data-campo="empresa"]');
    const campoResponsavel = document.querySelector('[data-campo="responsavel"]');
    const campoTelefone = document.querySelector('[data-campo="telefone"]');
    const campoEmail = document.querySelector('[data-campo="email"]');
    const campoPedidos = document.querySelector('[data-campo="pedidos"]');
    const campoUltimoPedido = document.querySelector('[data-campo="ultimo-pedido"]');

    if (cards.length > 0 && modal) {
        cards.forEach(card => {
            card.addEventListener("click", function () {
                clienteSelecionadoId = card.dataset.id;

                if (campoEmpresa) campoEmpresa.textContent = card.dataset.empresa || "";
                if (campoResponsavel) campoResponsavel.textContent = card.dataset.responsavel || "";
                if (campoTelefone) campoTelefone.textContent = card.dataset.telefone || "";
                if (campoEmail) campoEmail.textContent = card.dataset.email || "";
                if (campoPedidos) campoPedidos.textContent = card.dataset.pedidos || "";
                if (campoUltimoPedido) campoUltimoPedido.textContent = card.dataset.ultimoPedido || "";

                modal.classList.add("active");
            });
        });
    }

    // Modal de funcionários
    const cardsFuncionarios = document.querySelectorAll(".funcionario-card");
    const modalFuncionario = document.getElementById("funcionarioModal");

    const campoNomeFuncionario = document.getElementById("modal-nome");
    const campoNomeCompletoFuncionario = document.getElementById("modal-nome-completo");
    const campoReFuncionario = document.getElementById("modal-re");
    const campoCpfFuncionario = document.getElementById("modal-cpf");
    const campoDataNascimentoFuncionario = document.getElementById("modal-data-nascimento");
    const campoTelefoneFuncionario = document.getElementById("modal-telefone");
    const campoEmailFuncionario = document.getElementById("modal-email");
    const campoEnderecoFuncionario = document.getElementById("modal-endereco");
    const campoSetorFuncionario = document.getElementById("modal-setor");
    const campoContratacaoFuncionario = document.getElementById("modal-contratacao");
    const campoSalarioFuncionario = document.getElementById("modal-salario");
    const campoStatusFuncionario = document.getElementById("modal-status");

    if (cardsFuncionarios.length > 0 && modalFuncionario) {
        cardsFuncionarios.forEach(card => {
            card.addEventListener("click", function () {
                funcionarioSelecionadoId = card.dataset.id;

                if (campoNomeFuncionario) campoNomeFuncionario.textContent = card.dataset.nome || "";
                if (campoNomeCompletoFuncionario) campoNomeCompletoFuncionario.textContent = card.dataset.nome || "";
                if (campoReFuncionario) campoReFuncionario.textContent = card.dataset.re || "";
                if (campoCpfFuncionario) campoCpfFuncionario.textContent = card.dataset.cpf || "";
                if (campoDataNascimentoFuncionario) campoDataNascimentoFuncionario.textContent = card.dataset.dataNascimento || "";
                if (campoTelefoneFuncionario) campoTelefoneFuncionario.textContent = card.dataset.telefone || "";
                if (campoEmailFuncionario) campoEmailFuncionario.textContent = card.dataset.email || "";
                if (campoEnderecoFuncionario) campoEnderecoFuncionario.textContent = card.dataset.endereco || "";
                if (campoSetorFuncionario) campoSetorFuncionario.textContent = card.dataset.setor || "";
                if (campoContratacaoFuncionario) campoContratacaoFuncionario.textContent = card.dataset.contratacao || "";
                if (campoSalarioFuncionario) campoSalarioFuncionario.textContent = card.dataset.salario || "";
                if (campoStatusFuncionario) campoStatusFuncionario.textContent = card.dataset.status || "";

                // resetar aba ao abrir
                modalFuncionario.querySelectorAll(".tab-content").forEach(tab => {
                    tab.classList.remove("active");
                });

                modalFuncionario.querySelectorAll(".tab-btn").forEach(botao => {
                    botao.classList.remove("active");
                });

                const primeiraAba = modalFuncionario.querySelector("#dados");
                const primeiroBotao = modalFuncionario.querySelector(".tab-btn");

                if (primeiraAba) primeiraAba.classList.add("active");
                if (primeiroBotao) primeiroBotao.classList.add("active");

                modalFuncionario.classList.add("active");
            });
        });
    }
});

// Fechar modal clicando fora
window.addEventListener("click", function (event) {
    const modalCliente = document.getElementById("clienteModal");
    const modalFuncionario = document.getElementById("funcionarioModal");

    if (modalCliente && event.target === modalCliente) {
        fecharModalCliente();
    }

    if (modalFuncionario && event.target === modalFuncionario) {
        fecharModalFuncionario();
    }
});

function editarCliente() {
    if (!clienteSelecionadoId) return;

    window.location.href = `cadastro-cliente.html?id=${clienteSelecionadoId}`;
}

function editarFuncionario() {
    if (!funcionarioSelecionadoId) return;

    window.location.href = `form_funcionario.html?id=${funcionarioSelecionadoId}`;
}

// trocar abas do modal
function trocarAba(tabId, btn) {
    const modal = btn.closest(".funcionario-modal");

    modal.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    modal.querySelectorAll(".modal-tab-btn").forEach(botao => {
        botao.classList.remove("active");
    });

    modal.querySelector(`#${tabId}`).classList.add("active");
    btn.classList.add("active");
}
// Sidebar
// submenu pedidos
const dropdown = document.querySelector(".menu-dropdown");

if (dropdown) {
    dropdown.addEventListener("mouseenter", () => {
        dropdown.setAttribute("open", "");
    });

    dropdown.addEventListener("mouseleave", () => {
        dropdown.removeAttribute("open");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.querySelector(".menu-dropdown");

    if (dropdown) {
        dropdown.addEventListener("mouseenter", () => {
            dropdown.open = true;
        });

        dropdown.addEventListener("mouseleave", () => {
            dropdown.open = false;
        });

        const summary = dropdown.querySelector("summary");

        if (summary) {
            summary.addEventListener("click", (e) => {
                e.preventDefault();
            });
        }
    }
});


    // GRÁFICO DE DONUT
const producaoCanvas = document.getElementById("producaoChart");

if (producaoCanvas) {
    new Chart(producaoCanvas, {
        type: "line",
        data: {
            labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
            datasets: [{
                data: [120, 190, 150, 220, 180, 240],
                borderColor: "#6366f1",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#6366f1",
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "#9ca3af" }
                },
                y: {
                    grid: { color: "#f1f5f9" },
                    ticks: { color: "#9ca3af" }
                }
            }
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {

    const statusCanvas = document.getElementById("statusChart");

    if (statusCanvas) {
        new Chart(statusCanvas, {
            type: "doughnut",
            data: {
                labels: ["Pendentes", "Produção", "Concluídos"],
               
                
                datasets: [{
                    data: [12, 8, 38],
                    backgroundColor: [
                        "#151e31", // roxo principal
                        "#4400ff", // roxo médio
                        "#b3c0d75c"  // roxo claro
                    ],
                    borderWidth: 0 // remove borda feia
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%", // deixa o donut mais fino (moderno)
                plugins: {
                    legend: {
                        position: "right",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 20,
                            color: "#374151",
                            font: {
                                size: 14
                            }
                            
                        }
                    }
                }
            }
        });
    }

});

// tela de add item

// aside

