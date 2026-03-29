
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



// função genérica para abrir qualquer modal pelo id
function abrirModal(idModal) {
    const modal = document.getElementById(idModal);

    if (modal) {
        modal.classList.add("active");
    }
}

// função genérica para fechar qualquer modal pelo id
function fecharModal(idModal) {
    const modal = document.getElementById(idModal);

    if (!modal) return;

    modal.classList.remove("active");

    const form = modal.querySelector("form");
    if (form) {
        form.reset();
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

    // ACRESCENTADO: muda texto do botão do estoque automaticamente
    const botaoAcaoEstoque = document.getElementById("estoqueActionButton");
    if (botaoAcaoEstoque) {
        botaoAcaoEstoque.textContent = tabId === "movimentacoes" ? "+ Movimentação" : "+ Item";
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

// contador genérico
function atualizarContadorLista(seletorItens, seletorContador) {
    const itens = document.querySelectorAll(seletorItens);
    const contador = document.querySelector(seletorContador);

    if (contador) {
        contador.textContent = itens.length;
    }
}

// variáveis globais
let clienteSelecionadoId = null;
let funcionarioSelecionadoId = null;



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

        valor = (parseInt(valor, 10) / 100).toFixed(2);
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

    inicializarDropdownSidebar();
    inicializarAberturaDeModal();
    inicializarFechamentoDeModal();
    inicializarFechamentoAoClicarFora();
    inicializarFormularioModal("clienteForm", "clienteFormModal");
    inicializarFormularioModal("funcionarioForm", "funcionarioFormModal");
    inicializarEstados();
    inicializarBuscaCep();
    inicializarMascaraSalario();

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

                modalFuncionario.querySelectorAll(".tab-btn, .modal-tab-btn").forEach(botao => {
                    botao.classList.remove("active");
                });

                const primeiraAba = modalFuncionario.querySelector("#dados");
                const primeiroBotao = modalFuncionario.querySelector(".tab-btn, .modal-tab-btn");

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
    const modal = btn.closest(".funcionario-modal, .modal, .modal-overlay");

    if (!modal) return;

    modal.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    modal.querySelectorAll(".modal-tab-btn, .tab-btn").forEach(botao => {
        botao.classList.remove("active");
    });

    const aba = modal.querySelector(`#${tabId}`);
    if (aba) {
        aba.classList.add("active");
    }

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


// GRÁFICO DE LINHA
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
                        "#151e31",
                        "#4400ff",
                        "#b3c0d75c"
                    ],
                    borderWidth: 0
                }]
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

// Tela de clientes