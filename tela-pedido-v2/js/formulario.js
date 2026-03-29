// =========================
// FORMULARIO.JS
// =========================

// --- PEGANDO O FORMULARIO PELO ID ---
const formulario = document.getElementById("meuFormulario");

if (formulario) {
    formulario.addEventListener("submit", function (event) {
        event.preventDefault();

        // --- CAPTURA DOS DADOS ---
        const nomeCliente = document.querySelector("#nomeCliente").value.trim();
        const dataEntrega = document.querySelector("#prazoEntrega").value;
        const contatoCliente = document.querySelector("#telefoneCliente").value.trim();
        const emailCliente = document.querySelector("#emailCliente").value.trim();
        const localPersonalizacao = document.querySelector("#localPersonalizacao").value.trim();
        const obsPersonalizacao = document.querySelector("#obsPersonalizacao").value.trim();
        const obsGeral = document.querySelector("#obsGeralPedido").value.trim();

        // ✅ CAPTURA A PRIORIDADE CORRETA (input name="pedido_prioridade")
        const prioridadeElemento = document.querySelector('input[name="pedido_prioridade"]:checked');
        const prioridadeValor = prioridadeElemento ? prioridadeElemento.value : "Não informada";

        // --- VALIDAÇÃO SIMPLES ---
        if (!nomeCliente || !dataEntrega || !contatoCliente || !emailCliente || !localPersonalizacao) {
            alert("Preencha todos os campos obrigatórios!");
            return;
        }

        // --- MONTANDO OBJETO ---
        const fichaTecnica = {
            cliente: nomeCliente,
            entrega: dataEntrega,
            contato: contatoCliente,
            email: emailCliente,
            local: localPersonalizacao,         // Local da arte
            personalizacao: obsPersonalizacao,
            observacao: obsGeral,
            prioridade: prioridadeValor,       // Prioridade selecionada
            dataCriacao: new Date().toLocaleDateString('pt-BR'),
        };

        // --- SALVANDO ---
        localStorage.setItem("dadosFicha", JSON.stringify(fichaTecnica));

        // DEBUG (opcional, pode apagar depois)
        console.log("Dados salvos:", fichaTecnica);

        // --- REDIRECIONAMENTO ---
        window.location.href = "novo-pedido.html";
    });
}