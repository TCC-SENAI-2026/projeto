export function estaBaixo(item) {
  return Number(item.quantidade_atual) <= Number(item.estoque_minimo);
}