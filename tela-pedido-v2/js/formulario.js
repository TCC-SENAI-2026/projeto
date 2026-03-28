// --- PEGANDO O FORMULARIO PELO ID ---
const formulario = document.getElementById("meuFormulario");

if (formulario) { 
    formulario.addEventListener("submit", function(event) {
        event.preventDefault();

        // Captura dos valores dos inputs (IDs verificados no seu HTML)
        const nomeCliente = document.querySelector("#nomeCliente").value;
        const dataEntrega = document.querySelector("#prazoEntrega").value;
        const contatoCliente = document.querySelector("#telefoneCliente").value;
        const emailCliente = document.querySelector("#emailCliente").value;
        const localPersonalizacao = document.querySelector("#localPersonalizacao").value;
        const obsPersonalizacao = document.querySelector("#obsPersonalizacao").value;
        const obsGeral = document.querySelector("#obsGeralPedido").value;

        // --- AJUSTE: Capturando a Prioridade selecionada ---
        // Usamos o 'name' porque rádio buttons compartilham o mesmo nome
        const prioridadeElemento = document.querySelector('input[name="pedido_prioridade"]:checked');
        const prioridadeValor = prioridadeElemento ? prioridadeElemento.value : "Não informada";

        // Pacotando os objetos (Adicionada a prioridade no pacote)
        const fichaTecnica = {
            cliente: nomeCliente,
            entrega: dataEntrega,
            contato: contatoCliente,
            email: emailCliente,
            local: localPersonalizacao,
            personalizacao: obsPersonalizacao,
            observacao: obsGeral,
            prioridade: prioridadeValor, // Agora essa info vai para a próxima tela!
            dataCriacao: new Date().toLocaleDateString('pt-BR'), 
        };

        // Salvando no localStorage
        localStorage.setItem("dadosFicha", JSON.stringify(fichaTecnica));

        // Redirecionamento
        window.location.href = "novo-pedido.html";
    });
}