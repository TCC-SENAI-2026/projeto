// TODO(BACK): os valores de status devem ser exatamente estas chaves
// ("pendente", "producao", "finalizado"). Qualquer outro valor aparece como "Pendente".
export const STATUS = {
  pendente: { classe: "pendente", texto: "Pendente" },
  producao: { classe: "producao", texto: "Em produção" },
  finalizado: { classe: "ok", texto: "Finalizado" },
};

export function infoStatus(pedido) {
  return STATUS[pedido.status] || STATUS.pendente;
}