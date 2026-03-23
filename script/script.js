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

let clienteSelecionadoId = null;

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

function abrirModal(idModal) {
    const modal = document.getElementById(idModal);

    if (modal) {
        modal.classList.add("active");
    }
}

function fecharModal(idModal) {
    const modal = document.getElementById(idModal);

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    const form = modal.querySelector("form");
    if (form) {
        form.reset();
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

    const contadorEstoque = document.querySelector(".page-count");
    const itensEstoque = document.querySelectorAll(`#${tabId} .estoque-row`);
    const botaoAcaoEstoque = document.getElementById("estoqueActionButton");

    if (contadorEstoque && document.querySelector(".estoque-row")) {
        contadorEstoque.textContent = `(${itensEstoque.length})`;
    }

    if (botaoAcaoEstoque) {
        botaoAcaoEstoque.textContent = tabId === "movimentacoes" ? "+ Movimentação" : "+ Item";
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

function atualizarContadorLista(seletorItens, seletorContador) {
    const itens = document.querySelectorAll(seletorItens);
    const contador = document.querySelector(seletorContador);

    if (contador) {
        contador.textContent = itens.length;
    }
}

function inicializarAberturaDeModal() {
    document.querySelectorAll("[data-modal-open]").forEach(botao => {
        botao.addEventListener("click", () => abrirModal(botao.dataset.modalOpen));
    });
}

function inicializarFechamentoDeModal() {
    document.querySelectorAll("[data-modal-close]").forEach(botao => {
        botao.addEventListener("click", () => fecharModal(botao.dataset.modalClose));
    });
}

function inicializarFechamentoAoClicarFora() {
    document.querySelectorAll(".modal-overlay").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal && modal.id) {
                fecharModal(modal.id);
            }
        });
    });
}

function inicializarFormularioModal(formId, modalId) {
    const form = document.getElementById(formId);

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();
            fecharModal(modalId);
        });
    }
}

function inicializarModalDetalhes(config) {
    const cards = document.querySelectorAll(config.cardSelector);
    const modal = document.getElementById(config.modalId);

    if (!cards.length || !modal) {
        return;
    }

    cards.forEach(card => {
        card.addEventListener("click", () => {
            if (config.onSelect) {
                config.onSelect(card);
            }

            Object.entries(config.fields).forEach(([campo, seletor]) => {
                const destino = modal.querySelector(seletor);
                if (destino) {
                    destino.textContent = card.dataset[campo] || "";
                }
            });

            abrirModal(config.modalId);
        });
    });
}

function inicializarEstados() {
    const selectEstado = document.getElementById("estado");

    if (!selectEstado) {
        return;
    }

    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
        .then(res => res.json())
        .then(estados => {
            estados.sort((a, b) => a.nome.localeCompare(b.nome));

            selectEstado.innerHTML = '<option value="">Selecione</option>';

            estados.forEach(estado => {
                const option = document.createElement("option");
                option.value = estado.sigla;
                option.textContent = estado.sigla;
                selectEstado.appendChild(option);
            });
        })
        .catch(() => {
            selectEstado.innerHTML = '<option value="">Não foi possível carregar</option>';
        });
}

function inicializarBuscaCep() {
    const inputCep = document.getElementById("cep");
    const selectEstado = document.getElementById("estado");

    if (!inputCep) {
        return;
    }

    inputCep.addEventListener("blur", () => {
        const cep = inputCep.value.replace(/\D/g, "");

        if (cep.length !== 8) {
            return;
        }

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(res => res.json())
            .then(dados => {
                if (dados.erro) {
                    alert("CEP não encontrado.");
                    return;
                }

                const municipio = document.getElementById("municipio");
                const rua = document.getElementById("rua");

                if (municipio) {
                    municipio.value = dados.localidade || "";
                }

                if (rua) {
                    rua.value = dados.logradouro || "";
                }

                if (selectEstado) {
                    selectEstado.value = dados.uf || "";
                }
            })
            .catch(() => {
                alert("Não foi possível buscar o CEP.");
            });
    });
}

function inicializarMascaraSalario() {
    const salario = document.getElementById("salario");

    if (!salario) {
        return;
    }

    salario.addEventListener("input", function () {
        let valor = this.value.replace(/\D/g, "");

        if (!valor) {
            this.value = "";
            return;
        }

        valor = parseFloat(valor).toFixed(2);
        valor = valor.replace(".", ",");
        valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        this.value = valor;
    });
}

function inicializarDropdownSidebar() {
    document.querySelectorAll(".menu-dropdown").forEach(dropdown => {
        const links = dropdown.querySelectorAll(".submenu a");
        const possuiLinkAtivo = Array.from(links).some(link => link.href === window.location.href);

        dropdown.open = possuiLinkAtivo;
    });
}

// inicializacao

document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll(".menu a, .submenu a");

    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("ativo");
        }
    });

    inicializarDropdownSidebar();

    if (document.querySelector("#recentes")) {
        atualizarContadorPedidos();
    }

    if (document.querySelector(".estoque-row")) {
        atualizarContadorEstoque("produtos");
    }

    if (document.querySelector(".client-card")) {
        atualizarContadorLista(".client-card", "#client-count");
    }

    if (document.querySelector(".funcionario-card")) {
        atualizarContadorLista(".funcionario-card", "#funcionario-count");
    }

    inicializarAberturaDeModal();
    inicializarFechamentoDeModal();
    inicializarFechamentoAoClicarFora();

    inicializarModalDetalhes({
        cardSelector: ".client-card",
        modalId: "clienteModal",
        onSelect: card => {
            clienteSelecionadoId = card.dataset.id;
        },
        fields: {
            empresa: '[data-campo="empresa"]',
            responsavel: '[data-campo="responsavel"]',
            telefone: '[data-campo="telefone"]',
            email: '[data-campo="email"]',
            pedidos: '[data-campo="pedidos"]',
            ultimoPedido: '[data-campo="ultimo-pedido"]'
        }
    });

    inicializarModalDetalhes({
        cardSelector: ".funcionario-card",
        modalId: "funcionarioModal",
        fields: {
            empresa: '[data-campo="empresa"]',
            responsavel: '[data-campo="responsavel"]',
            telefone: '[data-campo="telefone"]',
            email: '[data-campo="email"]',
            pedidos: '[data-campo="pedidos"]',
            ultimoPedido: '[data-campo="ultimo-pedido"]'
        }
    });

    inicializarFormularioModal("clienteForm", "clienteFormModal");
    inicializarFormularioModal("funcionarioForm", "funcionarioFormModal");
    inicializarEstados();
    inicializarBuscaCep();
    inicializarMascaraSalario();
});

function editarCliente() {
    if (!clienteSelecionadoId) return;

    window.location.href = `cadastro-cliente.html?id=${clienteSelecionadoId}`;
}
