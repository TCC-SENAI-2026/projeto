// graficos

const producaoCanvas = document.getElementById("producaoChart");

if (producaoCanvas) {
    new Chart(producaoCanvas, {
        type: "bar",
        data: {
            labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
            datasets: [{
                label: "Peças Produzidas",
                data: [120, 190, 150, 220, 180, 240],
                backgroundColor: "#2563eb"
            }]
        }
    });
}

const statusCanvas = document.getElementById("statusChart");

if (statusCanvas) {
    new Chart(statusCanvas, {
        type: "doughnut",
        data: {
            labels: ["Pendentes", "Produção", "Concluídos"],
            datasets: [{
                data: [12, 8, 38],
                backgroundColor: ["#f59e0b", "#3b82f6", "#16a34a"]
            }]
        }
    });
}

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

// abas

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

    // Atualiza contador do estoque
    const contadorEstoque = document.querySelector(".page-count");
    const itensEstoque = document.querySelectorAll(`#${tabId} .estoque-row`);

    if (contadorEstoque && itensEstoque.length >= 0 && document.querySelector(".estoque-row")) {
        contadorEstoque.textContent = `(${itensEstoque.length})`;
    }
}

// contadores 

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

// inicialização

document.addEventListener("DOMContentLoaded", function () {
    // Link ativo do menu
    const links = document.querySelectorAll(".menu a, .submenu a");

    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("ativo");
        }
    });

    // Contador de pedidos
    if (document.querySelector("#recentes")) {
        atualizarContadorPedidos();
    }

    // Contador de estoque
    if (document.querySelector(".estoque-row")) {
        atualizarContadorEstoque("produtos");
    }

    // Contador de clientes
    if (document.querySelector(".client-card")) {
        atualizarContadorClientes();
    }

    // Modal de clientes
    let clienteSelecionadoId = null;


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

        campoEmpresa.textContent = card.dataset.empresa;
        campoResponsavel.textContent = card.dataset.responsavel;
        campoTelefone.textContent = card.dataset.telefone;
        campoEmail.textContent = card.dataset.email;
        campoPedidos.textContent = card.dataset.pedidos;
        campoUltimoPedido.textContent = card.dataset.ultimoPedido;

        modal.classList.add("active");
    });
});
    }
});

// Fechar modal clicando fora
window.addEventListener("click", function (event) {
    const modal = document.getElementById("clienteModal");

    if (modal && event.target === modal) {
        fecharModalCliente();
    }
});

function editarCliente() {
    if (!clienteSelecionadoId) return;

    window.location.href = `cadastro-cliente.html?id=${clienteSelecionadoId}`;
}