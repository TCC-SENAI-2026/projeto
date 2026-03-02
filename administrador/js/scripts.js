// 1. Seleção dos elementos do DOM
const modal = document.getElementById('modal-container');
const botaoAbrir = document.getElementById('botao-continuar-modal');
const botaoFecharModal = document.querySelector('.btn-voltar'); // Botão "Voltar e editar" dentro do modal
const botaoVoltarForm = document.getElementById('botao-voltar-form'); // Botão "Voltar" do formulário principal

// 2. Função para Abrir o Modal
// Unificada em um único evento para evitar repetições
botaoAbrir.addEventListener('click', function(event) {
    event.preventDefault(); // Impede o comportamento padrão do botão/formulário
    
    console.log('Abrindo revisão do pedido...');
    
    // Adiciona a classe que torna o modal visível
    modal.classList.add('mostrar');
});

// 3. Função para Fechar o Modal
// O modal SÓ fecha quando este botão for clicado
botaoFecharModal.addEventListener('click', function(event) {
    event.preventDefault();
    
    console.log('Fechando modal para edição...');
    
    // Remove a classe e esconde o modal
    modal.classList.remove('mostrar');
});

// 4. Lógica para o botão "Voltar" do Formulário Principal (Card 3)
if (botaoVoltarForm) {
    botaoVoltarForm.addEventListener('click', function(event) {
        event.preventDefault();
        // Aqui você pode adicionar uma ação, como voltar para a seção anterior
        console.log('Usuário clicou em voltar no formulário.');
    });
}