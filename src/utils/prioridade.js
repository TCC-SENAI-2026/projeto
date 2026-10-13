// Cores e textos da prioridade. Valores esperados do back: "baixa", "media", "alta"
export const PRIORIDADE = {
  baixa: { classe: "prio-baixa", texto: "Baixa" },
  media: { classe: "prio-media", texto: "Média" },
  alta:  { classe: "prio-alta",  texto: "Alta" },
};

export function infoPrioridade(pedido) {
  return PRIORIDADE[pedido.ficha?.prioridade] || null;
}