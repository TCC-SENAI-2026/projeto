// Selecionando os elementos
const modalContainer = document.getElementById('modal-container');
const btnContinuar = document.querySelector('.container-3 .btn-continuar'); // Ajuste a classe se necessário
const btnVoltar = document.querySelector('.btn-voltar');

// Função para abrir o modal
btnContinuar.addEventListener('click', () => {
    modalContainer.style.display = 'flex'; // Exibe o container como flex para centralizar
    document.body.style.overflow = 'hidden'; // Opcional: trava o scroll da página ao fundo
});

// Função para fechar o modal
btnVoltar.addEventListener('click', () => {
    modalContainer.style.display = 'none'; // Esconde o modal
    document.body.style.overflow = 'auto'; // Devolve o scroll à página
});

// BÔNUS: Fechar ao clicar fora do modal (no fundo escuro)
modalContainer.addEventListener('click', (event) => {
    if (event.target === modalContainer) {
        modalContainer.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});