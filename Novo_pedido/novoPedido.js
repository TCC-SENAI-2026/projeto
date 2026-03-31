document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // NOME DO CLIENTE
    // =========================
    const clienteNome = localStorage.getItem('clienteSelecionado');
    const idsDisplay = ['clienteNomeDisplay', 'clienteNomeDisplay1'];

    idsDisplay.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = clienteNome || "Cliente não selecionado";
        }
    });

    // =========================
    // UPLOAD COM PREVIEW
    // =========================
    const inputArte = document.getElementById('input-arte');
    const areaUpload = document.querySelector('.upload-img');

    if (inputArte && areaUpload) {
        inputArte.addEventListener('change', function () {

            if (this.files && this.files[0]) {
                const file = this.files[0];
                const reader = new FileReader();

                reader.onload = function (e) {
                    areaUpload.innerHTML = `
                        <img src="${e.target.result}" 
                        style="max-width:100%; max-height:100%; border-radius:10px;">
                    `;

                    // SALVA IMAGEM
                    localStorage.setItem("artePedido", e.target.result);
                };

                reader.readAsDataURL(file);

                areaUpload.style.borderColor = "#28a745";
            }
        });
    }

    // =========================
    // TROCAR COR DO CARD 🔥
    // =========================
    const selectsCor = document.querySelectorAll('select[name*="_cor"]');

    selectsCor.forEach(select => {
        select.addEventListener('change', function () {

            const card = this.closest('.modelo-card');

            // REMOVE TODAS AS CORES ANTIGAS
            card.classList.forEach(classe => {
                if (classe.startsWith('cor-')) {
                    card.classList.remove(classe);
                }
            });

            // ADICIONA NOVA COR
            if (this.value) {
                card.classList.add(`cor-${this.value}`);
            }
        });
    });

    // =========================
    // BOTÕES
    // =========================
    const btnRevisar = document.getElementById('botao-continuar-ficha');
    if (btnRevisar) {
        btnRevisar.addEventListener('click', finalizarPedido);
    }

    const btnVoltar = document.getElementById('botao-voltar-form');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            // VOLTAR DIRETO PARA O FORMULÁRIO
            window.location.href = "formulario.html";
        });
    }

});


// =========================
// VIRAR CARD 🔥
// =========================
function alternarSelecao(btn) {
    const card = btn.closest('.modelo-card');

    if (card.classList.contains('selecionado')) {

        card.classList.remove('selecionado');

        // ZERA QUANTIDADES
        card.querySelectorAll('input[type="number"]').forEach(input => {
            input.value = 0;
        });

    } else {
        card.classList.add('selecionado');
    }
}


// =========================
// FINALIZAR PEDIDO 🔥
// =========================
function finalizarPedido() {

    const selecionados = document.querySelectorAll('.modelo-card.selecionado');

    if (selecionados.length === 0) {
        alert("Selecione pelo menos um produto.");
        return;
    }

    let listaProdutos = [];
    let erroQtd = false;

    selecionados.forEach(card => {

        const nomeModelo = card.querySelector('h3').textContent;

        // SELECTS
        const selectPersonalizacao = card.querySelector('select[name*="personalizacao"]');
        const selectTecido = card.querySelector('select[name*="tecido"]');
        const selectCor = card.querySelector('select[name*="cor"]');
        const selectLocal = card.querySelector('select[name*="local"]');

        const personalizacao = selectPersonalizacao?.value || "Não definido";
        const tecido = selectTecido?.value || "Não definido";
        const cor = selectCor?.value || "Não definida";
        const local = selectLocal?.value || "Não definido";

        let grade = {};
        let total = 0;

        const inputs = card.querySelectorAll('.grade-tamanhos-card input');

        inputs.forEach(input => {
            const qtd = parseInt(input.value) || 0;

            if (qtd > 0) {
                const tamanho = input.previousElementSibling.textContent.trim();
                grade[tamanho] = qtd;
                total += qtd;
            }
        });

        if (total === 0) {
            erroQtd = true;
        } else {
            listaProdutos.push({
                item: nomeModelo,
                grade: grade,
                detalhes: {
                    tecido,
                    cor,
                    personalizacao,
                    local
                }
            });
        }
    });

    if (erroQtd) {
        alert("Preencha as quantidades dos tamanhos.");
        return;
    }

    // =========================
    // ARTE
    // =========================
    const arteSalva = localStorage.getItem("artePedido");

    if (!arteSalva) {
        if (!confirm("Nenhuma arte enviada. Deseja continuar?")) {
            return;
        }
    }

    // =========================
    // SALVAR TUDO
    // =========================
    localStorage.setItem("detalhesPedido", JSON.stringify({
        produtos: listaProdutos,
        arte: arteSalva || null
    }));

    // =========================
    // REDIRECIONAR
    // =========================
    alert("Pedido salvo! Indo para ficha técnica...");
    window.location.href = "fichaTecnica.html";
}