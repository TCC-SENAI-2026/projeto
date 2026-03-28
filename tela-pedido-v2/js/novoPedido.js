document.addEventListener('DOMContentLoaded', () => {
    // 1. EXIBIR NOME DO CLIENTE (Resolve o problema dos IDs diferentes)
    const clienteNome = localStorage.getItem('clienteSelecionado');
    const idsDisplay = ['clienteNomeDisplay', 'clienteNomeDisplay1'];
    
    idsDisplay.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = clienteNome || "Cliente não selecionado";
        }
    });

    // 2. CONFIGURAÇÃO DO UPLOAD (Click e Feedback visual)
    const inputArte = document.getElementById('input-arte');
    const areaUpload = document.querySelector('.upload-img');

    if (inputArte) {
        inputArte.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const nomeArquivo = this.files[0].name;
                areaUpload.querySelector('.upload-texto-principal strong').textContent = "Arquivo selecionado:";
                areaUpload.querySelector('.upload-texto-principal span').textContent = nomeArquivo;
                areaUpload.style.borderColor = "#28a745"; // Feedback verde
            }
        });
    }

    // 3. BOTÃO REVISAR (Chama a validação)
    const btnRevisar = document.getElementById('botao-continuar-ficha');
    if (btnRevisar) {
        btnRevisar.addEventListener('click', finalizarPedido);
    }

    // 4. BOTÃO VOLTAR
    const btnVoltar = document.getElementById('botao-voltar-form');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            window.history.back();
        });
    }
});

/**
 * Lógica para virar o card e marcar como selecionado
 */
function alternarSelecao(btn) {
    const cardInner = btn.closest('.card-inner');
    const cardPai = btn.closest('.modelo-card');
    
    if (cardPai.classList.contains('selecionado')) {
        // Desmarcar e voltar à posição original
        cardPai.classList.remove('selecionado');
        cardInner.style.transform = "rotateY(0deg)";
        // Zera quantidades ao desmarcar
        cardPai.querySelectorAll('input[type="number"]').forEach(input => input.value = 0);
    } else {
        // Selecionar e virar para o verso
        cardPai.classList.add('selecionado');
        cardInner.style.transform = "rotateY(180deg)";
    }
}

/**
 * Validação de dados antes de avançar
/* FUNÇÃO: finalizarPedido
   OBJETIVO: Validar os produtos selecionados, capturar a grade de tamanhos, 
   cores e salvar tudo no localStorage para a Ficha Técnica.
*/
function finalizarPedido() {
    const selecionados = document.querySelectorAll('.modelo-card.selecionado');
    
    // 1. Validação inicial: Verificando se algum card foi marcado
    if (selecionados.length === 0) {
        alert("Por favor, selecione ao menos um produto (Camiseta, Moletom ou Calça).");
        return;
    }

    let erroQtd = false;
    let listaProdutos = []; // Esta é a lista que o script da Ficha Técnica vai ler

    // 2. Percorre apenas os cards que possuem a classe 'selecionado'
    selecionados.forEach(card => {
        const nomeModelo = card.querySelector('h3').textContent;
        // Captura a cor selecionada no <select> do card
        const selectCor = card.querySelector('select');
        const corSelecionada = selectCor ? selectCor.value : "Não definida";
        
        let gradeDesteModelo = {};
        let totalDesteModelo = 0;
        
        // Mapeia cada input de tamanho (P, M, G...) e sua respectiva quantidade
        const inputs = card.querySelectorAll('.grade-tamanhos-card input');
        inputs.forEach(input => {
            const qtd = parseInt(input.value) || 0;
            if (qtd > 0) {
                // Captura o texto do Label (P, M, G...) que está imediatamente antes do input
                const labelTamanho = input.previousElementSibling.textContent.replace(':', '').trim();
                gradeDesteModelo[labelTamanho] = qtd;
                totalDesteModelo += qtd;
            }
        });

        // Se o card está selecionado mas a soma das quantidades é zero, gera erro
        if (totalDesteModelo === 0) {
            erroQtd = true;
        } else {
            // Monta o objeto no formato exato que o seu script da FICHA espera
            listaProdutos.push({
                item: nomeModelo,
                grade: gradeDesteModelo,
                detalhes: {
                    tecido: "Padrão TCC", 
                    cor: corSelecionada,
                    personalizacao: "Silk Screen/Bordado"
                }
            });
        }
    });

    // Se algum modelo selecionado estiver sem quantidade, para o processo
    if (erroQtd) {
        alert("Você selecionou um modelo, mas não informou a quantidade nos tamanhos (verso do card).");
        return;
    }

    // 3. Validação de Arte (Verifica se o input de arquivo tem algo)
    const inputArte = document.getElementById('input-arte');
    if (inputArte && inputArte.files.length === 0) {
        if(!confirm("Nenhuma arte foi enviada. Deseja continuar o pedido sem o arquivo da estampa?")) {
            return;
        }
    }

    // 4. SALVAMENTO E TRANSIÇÃO DE TELA
    // Salva a lista de produtos convertida em string JSON
    localStorage.setItem("detalhesPedido", JSON.stringify({ produtos: listaProdutos }));
    
    // Captura o nome do cliente que foi selecionado na tela inicial
    const nomeCliente = localStorage.getItem('clienteSelecionado') || "Consumidor Final";
    
    // Salva os dados do cabeçalho da ficha
    localStorage.setItem("dadosFicha", JSON.stringify({ 
        cliente: nomeCliente,
        dataEntrega: "30/04/2026" 
    }));

    // Feedback ao usuário e redirecionamento
    alert("Pedido validado com sucesso! Redirecionando para a Ficha Técnica...");
    window.location.href = "fichaTecnica.html"; 
}