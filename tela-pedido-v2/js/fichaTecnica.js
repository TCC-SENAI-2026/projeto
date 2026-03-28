document.addEventListener('DOMContentLoaded', () => {
    const detalhesPedido = JSON.parse(localStorage.getItem("detalhesPedido"));
    const dadosFicha = JSON.parse(localStorage.getItem("dadosFicha"));
    const mainContainer = document.getElementById('lista-produtos-container');

    if (!detalhesPedido || !detalhesPedido.produtos || detalhesPedido.produtos.length === 0) {
        if (mainContainer) {
            mainContainer.innerHTML = "<h2 style='color:white; text-align:center; margin-top:50px;'>Nenhum produto selecionado para revisão.</h2>";
        }
        return;
    }

    mainContainer.innerHTML = "";

    detalhesPedido.produtos.forEach((produto, index) => {
        const sessaoProduto = document.createElement('div');
        sessaoProduto.classList.add('container2');
        sessaoProduto.style.marginBottom = "20px"; 

        let linhasTabela = "";
        Object.entries(produto.grade).forEach(([tamanho, quantidade]) => {
            if (quantidade > 0) {
                linhasTabela += `
                    <tr>
                        <td><strong>${tamanho}</strong></td>
                        <td><strong>${quantidade}</strong></td>
                        <td><strong>${produto.detalhes.tecido}</strong></td>
                        <td><strong>${produto.detalhes.personalizacao}</strong></td>
                        <td><strong>${produto.detalhes.cor}</strong></td>
                    </tr>`;
            }
        });

        sessaoProduto.innerHTML = `
            <div class="infoproduto">
                <h2>Item #${index + 1}</h2>
                <h2>Cliente: <strong>${dadosFicha ? dadosFicha.cliente : 'Não informado'}</strong></h2>
                <h2>Tipo: <strong>${produto.item}</strong></h2>
                <h2>Tecido: <strong>${produto.detalhes.tecido}</strong></h2>
                <h2>Cor: <strong>${produto.detalhes.cor}</strong></h2>
                <h2>Entrega: <strong>30/04/2026</strong></h2>
            </div>
            <div class="boxprincipal">
                <div class="boxtabela">
                    <div class="card-visual-ficha" style="background-color: ${produto.detalhes.cor};">
                        <img src="img/${produto.item.toLowerCase()}.png" onerror="this.src='img/produto.png'">
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>T</th>
                                    <th>Quant</th>
                                    <th>Tecido</th>
                                    <th>Pers.</th>
                                    <th>Cor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${linhasTabela}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        mainContainer.appendChild(sessaoProduto);
    });
});

/* --- LÓGICA DO MODAL E REDIRECIONAMENTOS --- */

// Usamos arrow functions para garantir que o escopo global as reconheça prontamente
window.finalizarPedido = function() {
    const modal = document.getElementById('modalSucesso');
    
    if (modal) {
        modal.style.display = 'flex'; // Força o display flex para o modal aparecer
        localStorage.removeItem("detalhesPedido");
        // Opcional: localStorage.removeItem("dadosFicha"); 
    } else {
        alert("Pedido enviado para a produção com sucesso!");
        window.location.href = "index.html";
    }
};

window.fecharModalESair = function() {
    window.location.href = "index.html";
};

window.voltarParaPedido = function() {
    // Certifique-se que o arquivo no VS Code é novo-pedido.html
    window.location.href = "novo-pedido.html";
};