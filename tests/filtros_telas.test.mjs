import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filtrarClientes, filtrarColaboradores, filtrarPedidos, filtrarSolicitacoes } from '../src/utils/filtros.js';

const cliente = (nome, ativo) => Object.assign(Array(14).fill(''), { 0: nome, 12: ativo });
const clientes = [cliente('Confecção São João', true), cliente('Loja Antiga', false)];
const colaboradores = [
  { id: 1, nome_completo: 'João Silva', re: '00123', email: 'joao@exemplo.com', ativo: 1 },
  { id: 2, nome_completo: 'Ana', re: 456, email: 'ana@exemplo.com', ativo: 0 },
];
const pedidos = [
  { id: 1, numero_pedido: 100, status: 'pendente', ficha: { cliente: 'São João' } },
  { id: 2, numero_pedido: 200, status: 'producao', ficha: { cliente: 'Confecção Azul' } },
  { id: 3, numero_pedido: 300, status: 'finalizado', ficha: { cliente: 'Zilda' } },
  { id: 4, numero_pedido: 400, status: 'finalizado', ficha: { cliente: 'Ágata' } },
];
const ids = itens => itens.map(item => item.id);

test('Clientes: ativos por padrão, inativos, todos e busca combinada', () => {
  assert.deepEqual(filtrarClientes(clientes, 'Ativos', ''), [clientes[0]]);
  assert.deepEqual(filtrarClientes(clientes, 'Inativos', ''), [clientes[1]]);
  assert.deepEqual(filtrarClientes(clientes, 'Todos', ''), clientes);
  assert.deepEqual(filtrarClientes(clientes, 'Ativos', '  CONFECCAO SAO  '), [clientes[0]]);
  assert.deepEqual(filtrarClientes(clientes, 'Inativos', 'joao'), [clientes[0]]);
  assert.deepEqual(filtrarClientes(clientes, 'Todos', 'inexistente'), []);
  assert.deepEqual(filtrarClientes([], 'Todos', ''), []);
});

test('Colaboradores: status, nome, RE com zeros, RE numérico e e-mail', () => {
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Ativos', 'JOAO')), [1]);
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Ativos', '00123')), [1]);
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Inativos', '456')), [2]);
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Todos', ' ANA@EXEMPLO.COM ')), [2]);
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Ativos', 'ana')), [2]);
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Todos', ' ')), [1, 2]);
  assert.deepEqual(filtrarColaboradores([], 'Ativos', ''), []);
});

test('Pedidos: filtros por status e busca por cliente e número visível', () => {
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'recentes', '', '')), [1, 2]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'recentes', 'pendente', 'SAO JOAO')), [1]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'recentes', 'producao', 'confeccao')), [2]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'recentes', '', ' # 200 ')), [2]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'recentes', '', 'inexistente')), []);
  assert.deepEqual(filtrarPedidos([], 'recentes', '', ''), []);
});

test('Histórico: concluídos, pesquisa e ordenação sem modificar a lista original', () => {
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'historico', 'finalizado', '', 'asc')), [4, 3]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'historico', 'finalizado', '', 'desc')), [3, 4]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'historico', 'finalizado', 'agata')), [4]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'historico', 'finalizado', '#300')), [3]);
  assert.deepEqual(ids(pedidos), [1, 2, 3, 4]);
});

test('Painel: todas as combinações de categoria e status, com retorno ao total', () => {
  const categorias = ['Pedidos', 'Estoque', 'Clientes', 'Perfis'];
  const estados = ['Pendentes', 'Aprovadas', 'Recusadas'];
  const registros = categorias.flatMap(categoria => estados.map(status => ({ categoria, status })));
  for (const estado of estados) {
    for (const categoria of categorias) {
      assert.deepEqual(filtrarSolicitacoes(registros, categoria, estado), [{ categoria, status: estado }]);
    }
    assert.equal(filtrarSolicitacoes(registros, 'Todas', estado).length, 4);
  }
  assert.deepEqual(filtrarSolicitacoes([], 'Todas', 'Pendentes'), []);
});


test('Pesquisa de pedidos atravessa filtros e histórico; limpar restaura a aba', () => {
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'recentes', 'pendente', 'agata')), [4]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'historico', 'finalizado', 'sao joao')), [1]);
  assert.deepEqual(ids(filtrarPedidos(pedidos, 'recentes', 'pendente', '')), [1]);
});

test('Clientes e colaboradores: limpar busca volta a esconder inativos', () => {
  assert.deepEqual(filtrarClientes(clientes, 'Ativos', 'antiga'), [clientes[1]]);
  assert.deepEqual(filtrarClientes(clientes, 'Ativos', ''), [clientes[0]]);
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Ativos', 'ana')), [2]);
  assert.deepEqual(ids(filtrarColaboradores(colaboradores, 'Ativos', '')), [1]);
});
