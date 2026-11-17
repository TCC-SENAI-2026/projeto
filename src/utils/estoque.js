import { normalizarBusca } from './filtros.js';

export function filtrarEstoque(itens, filtro, pesquisa = '') {
  const termo = normalizarBusca(pesquisa);
  return itens.filter(item => {
    if (termo) return normalizarBusca(item.nome_item).includes(termo);
    const ativo = item.ativo === true || Number(item.ativo) === 1;
    if (ativo === (filtro === 'inativos')) return false;
    const tipo = normalizarBusca(item.tipo_item);
    const correspondeFiltro = filtro === 'produtos' ? tipo === 'produto'
      : filtro === 'materiais' ? tipo === 'material'
        : filtro === 'baixo' ? estaBaixo(item) : true;
    return correspondeFiltro && normalizarBusca(item.nome_item).includes(termo);
  });
}

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
