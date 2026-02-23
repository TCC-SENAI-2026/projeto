// Selecionando os elementos
const btnContinuar = document.getElementById('botao-continuar');
const btnVoltarModal = document.querySelector('.btn-voltar');
const modalContainer = document.getElementById('modal-container');
const fade = document.getElementById('fadee');

// Função para abrir
btnContinuar.addEventListener('click', () => {
    modalContainer.style.display = 'flex';
    fade.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

// Função para fechar
const fecharModal = () => {
    modalContainer.style.display = 'none';
    fade.style.display = 'none';
    document.body.style.overflow = 'auto';
};

btnVoltarModal.addEventListener('click', fecharModal);
fade.addEventListener('click', fecharModal); // Fecha se clicar no fundo escuro