
function openModal() {
  document.getElementById("resetModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("resetModal").style.display = "none";
}

function enviarSolicitacao() {
  alert("Solicitação enviada com sucesso.");
  closeModal();
}

/* fecha ao clicar fora da caixinha */
window.addEventListener("click", function (e) {
  const modal = document.getElementById("resetModal");
  if (e.target === modal) closeModal();
});

