// =========================
// FICHATECNICA.JS
// =========================
document.addEventListener('DOMContentLoaded', () => {

    const detalhesPedido = JSON.parse(localStorage.getItem("detalhesPedido"));
    const dadosFicha = JSON.parse(localStorage.getItem("dadosFicha"));
    const mainContainer = document.getElementById('lista-produtos-container');

    if (!detalhesPedido || !detalhesPedido.produtos || detalhesPedido.produtos.length === 0) {
        mainContainer.innerHTML = "<h2 style='color:white; text-align:center;'>Nenhum produto encontrado.</h2>";
        return;
    }

    mainContainer.innerHTML = "";

    detalhesPedido.produtos.forEach((produto, index) => {

        const div = document.createElement('div');
        div.classList.add('container2');

        // =========================
        // TABELA
        // =========================
        let linhas = "";

        Object.entries(produto.grade).forEach(([tam, qtd]) => {
            linhas += `
                <tr>
                    <td>${tam}</td>
                    <td>${qtd}</td>
                    <td>${produto.detalhes.tecido}</td>
                    <td>${produto.detalhes.personalizacao}</td>
                    <td>${produto.detalhes.cor}</td>
                    <td>${dadosFicha?.local || produto.detalhes.local}</td>
                </tr>
            `;
        });

        // =========================
        // HTML DO CARD
        // =========================
        div.innerHTML = `
            <div class="infoproduto">
                <h2>Item #${index + 1}</h2>

                <h2>Cliente: <strong>${dadosFicha?.cliente || '-'}</strong></h2>
                <h2>Contato: <strong>${dadosFicha?.contato || '-'}</strong></h2>
                <h2>Email: <strong>${dadosFicha?.email || '-'}</strong></h2>

                <h2>Prazo: <strong>${dadosFicha?.entrega || '-'}</strong></h2>
                <h2>Prioridade: <strong>${dadosFicha?.prioridade || '-'}</strong></h2> <!-- Corrigido -->

                <h2>Tipo: <strong>${produto.item}</strong></h2>
                <h2>Tecido: <strong>${produto.detalhes.tecido}</strong></h2>
                <h2>Cor: <strong>${produto.detalhes.cor}</strong></h2>

                <h2>Local da arte: <strong>${dadosFicha?.local || produto.detalhes.local}</strong></h2>
                <h2>Obs. Personalização: <strong>${dadosFicha?.personalizacao || '-'}</strong></h2>

                <h2>Obs. Pedido: <strong>${dadosFicha?.observacao || '-'}</strong></h2>
            </div>

            <div class="boxprincipal">

                <div class="boxtabela">

                    <div class="card-visual-ficha">
                        <img src="img/${produto.item.toLowerCase()}.png" 
                        onerror="this.src='img/produto.png'">
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>T</th>
                                    <th>Qtd</th>
                                    <th>Tecido</th>
                                    <th>Pers.</th>
                                    <th>Cor</th>
                                    <th>Local</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${linhas}
                            </tbody>
                        </table>
                    </div>

                </div>

                <!-- 🔥 IMAGEM DA ARTE -->
                ${detalhesPedido.arte ? `
                    <div style="margin-top:20px;">
                        <h3>Arte enviada:</h3>
                        <img src="${detalhesPedido.arte}" 
                        style="max-width:200px; border:2px solid black; border-radius:10px;">
                    </div>
                ` : ""}

            </div>
        `;

        mainContainer.appendChild(div);
    });

});


// =========================
// BOTÕES
// =========================
window.finalizarPedido = function () {

    const modal = document.getElementById('modalSucesso');

    if (modal) {
        modal.style.display = 'flex';

        localStorage.removeItem("detalhesPedido");
        // opcional:
        // localStorage.removeItem("dadosFicha");
    }
};

window.fecharModalESair = function () {
    window.location.href = "index.html";
};

window.voltarParaSelecao = function () {
    window.location.href = "novo-pedido.html";
};