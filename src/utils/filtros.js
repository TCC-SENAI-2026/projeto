export function normalizarBusca(valor) {
  return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function correspondeStatus(ativo, filtro) {
  const estaAtivo = ativo === true || Number(ativo) === 1;
  return filtro === 'Todos' || (filtro === 'Ativos' ? estaAtivo : !estaAtivo);
}

export function filtrarClientes(clientes, filtro, busca) {
  const termo = normalizarBusca(busca);
  return clientes.filter(cliente => (termo || correspondeStatus(cliente[12], filtro))
    && normalizarBusca(cliente[0]).includes(termo));
}

export function filtrarColaboradores(usuarios, filtro, busca) {
  const termo = normalizarBusca(busca);
  return usuarios.filter(usuario => (termo || correspondeStatus(usuario.ativo, filtro))
    && [usuario.nome_completo, usuario.re, usuario.email].some(valor => normalizarBusca(valor).includes(termo)));
}

export function nomeCliente(pedido) {
  return pedido.nome_cliente || pedido.ficha?.cliente || 'Sem cliente';
}

export function filtrarPedidos(pedidos, tab, filtro, busca, ordem = 'asc') {
  const termo = normalizarBusca(busca).replace(/^#\s*/, '');
  const visiveis = pedidos.filter(pedido => {
    const naAba = tab === 'historico' ? pedido.status === 'finalizado' : pedido.status !== 'finalizado';
    return (termo || (naAba && (!filtro || pedido.status === filtro)))
      && (String(pedido.numero_pedido || pedido.id).includes(termo)
        || normalizarBusca(nomeCliente(pedido)).includes(termo));
  });
  if (tab === 'historico') {
    visiveis.sort((a, b) => nomeCliente(a).localeCompare(nomeCliente(b), 'pt-BR') * (ordem === 'asc' ? 1 : -1));
  }
  return visiveis;
}

export function filtrarSolicitacoes(solicitacoes, tipo, status) {
  return solicitacoes.filter(item => (tipo === 'Todas' || item.categoria === tipo) && item.status === status);
}
