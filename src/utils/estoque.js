export function estaBaixo(item) {
  return Number(item.quantidade_atual) <= Number(item.estoque_minimo);
}

export function formatarQuantidadeEstoque(item) {
  const quantidade = item.quantidade_atual;
  const unidade = item.unidade_medida || "Unidade";
  const plural = {
    Unidade: "Unidades",
    Peça: "Peças",
    Metro: "Metros",
  };
  const rotulo = Number(quantidade) === 1 ? unidade : (plural[unidade] || unidade);

  return `${quantidade} ${rotulo}`;
}
