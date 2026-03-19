// --- LÓGICA DA PÁGINA DO FORMULÁRIO ---
const formulario = document.getElementById("meuFormulario");

if (formulario) { // Só executa se o formulário existir na página atual
    formulario.addEventListener("submit", function(event) {
        event.preventDefault();
        console.log("Validado! Indo para novo-pedido...");
        window.location.href = "novo-pedido.html";
    });
}

// --- LÓGICA DA PÁGINA NOVO-PEDIDO ---
const botaovoltarFormulario = document.getElementById("botao-voltar-form");

if (botaovoltarFormulario) { // Só executa se o botão de voltar existir na página atual
    botaovoltarFormulario.addEventListener("click", function() {
        console.log("Voltando para o formulário...");
        window.location.href = "formulario.html";
    });
}
