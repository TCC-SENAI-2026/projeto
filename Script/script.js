// ---------------------GRAFICOS---------------------

const producaoCanvas = document.getElementById("producaoChart");

if (producaoCanvas) {

    const producaoChart = new Chart(producaoCanvas, {
        type: 'bar',
        data: {
            labels: ['Jan','Fev','Mar','Abr','Mai','Jun'],
            datasets: [{
                label: 'Peças Produzidas',
                data: [120,190,150,220,180,240],
                backgroundColor: '#2563eb'
            }]
        }
    });

}
const statusCanvas = document.getElementById("statusChart");

if (statusCanvas) {

    const statusChart = new Chart(statusCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Pendentes','Produção','Concluídos'],
            datasets: [{
                data: [12,8,38],
                backgroundColor:[
                    '#f59e0b',
                    '#3b82f6',
                    '#16a34a'
                ]
            }]
        }
    });

}

// -----------------------------PDF--------------------------
function downloadPDF(){

const { jsPDF } = window.jspdf

const doc = new jsPDF()

// TITULO
doc.setFontSize(20)
doc.text("Relatório de Produção", 20, 20)

// DATA
doc.setFontSize(10)
doc.text("Gerado em: " + new Date().toLocaleDateString(), 20, 28)

// RESUMO
doc.setFontSize(14)
doc.text("Resumo Geral", 20, 45)

doc.setFontSize(11)
doc.text("Produção Total: 245 peças", 20, 55)
doc.text("Pedidos Concluídos: 38", 20, 62)
doc.text("Pedidos Pendentes: 12", 20, 69)
doc.text("Itens com Estoque Baixo: 4", 20, 76)

// TABELA DE EXEMPLO
doc.autoTable({
startY: 90,
head: [['Mês', 'Produção']],
body: [
['Janeiro', 120],
['Fevereiro', 190],
['Março', 150],
['Abril', 220],
['Maio', 180],
['Junho', 240]
]
})

// SALVAR
doc.save("relatorio-producao.pdf")

}



document.addEventListener("DOMContentLoaded", () => {

    const links = document.querySelectorAll(".menu a, .submenu a");

    links.forEach(link => {

        if (link.href === window.location.href) {
            link.classList.add("ativo");
        }

    });

});

function openTab(tabName, el) {

    const tabs = document.querySelectorAll(".tab-content");
    const buttons = document.querySelectorAll(".tab-btn");

    tabs.forEach(tab => tab.classList.remove("active"));
    buttons.forEach(btn => btn.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");
    el.classList.add("active");
}

function abrirPedido(id){
    window.location.href = `pedido-detalhe.html?id=${id}`;
}

function confirmarExclusao(id) {
    const confirmar = window.confirm(`Deseja realmente excluir o pedido #${id}?`);

    if (confirmar) {
            alert(`Pedido #${id} excluído com sucesso.`);
     }
 }

  function atualizarContador() {
        const pedidos = document.querySelectorAll("#recentes .product");
        const contador = document.querySelector(".page-count");

        const total = pedidos.length;

        contador.textContent = `(${total})`;
    }

    atualizarContador();

 function abrirItemEstoque(id) {
            window.location.href = `item-estoque.html?id=${id}`;
        }

// Estoque
// Contagem de itens no estoque

   function atualizarContadorEstoque(tabId) {
        const itens = document.querySelectorAll(`#${tabId} .estoque-row`);
        const contador = document.querySelector(".page-count");
        contador.textContent = `(${itens.length})`;
    }

    function openTab(tabId, btn) {
        document.querySelectorAll(".tab-content").forEach(tab => {
            tab.classList.remove("active");
        });

        document.querySelectorAll(".tab-btn").forEach(botao => {
            botao.classList.remove("active");
        });

        document.getElementById(tabId).classList.add("active");
        btn.classList.add("active");

        atualizarContadorEstoque(tabId);
    }

    atualizarContadorEstoque("produtos");