export function estaBaixo(item) {
  if (item.tipo_item?.toLowerCase() === "material" && item.tem_variacoes) {
    const cores = item.cores || [];
    return cores.length === 0 || cores.some(cor =>
      Number(cor.quantidade_atual) <= Number(cor.estoque_minimo));
  }
  return Number(item.quantidade_atual) <= Number(item.estoque_minimo);
}

export function formatarQuantidadeEstoque(item) {
  if (item.tipo_item?.toLowerCase() === "material") {
    const quantidadeCores = item.cores?.length || 0;
    return `${quantidadeCores} ${quantidadeCores === 1 ? "cor cadastrada" : "cores cadastradas"}`;
  }
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
