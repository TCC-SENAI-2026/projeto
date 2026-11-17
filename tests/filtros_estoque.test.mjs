import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filtrarEstoque } from '../src/utils/estoque.js';

const itens = [
  { id: 1, nome_item: 'Camiseta Básica', tipo_item: 'produto', ativo: 1, quantidade_atual: 20, estoque_minimo: 5 },
  { id: 2, nome_item: 'Calça', tipo_item: 'produto', ativo: true, quantidade_atual: 0, estoque_minimo: 2 },
  { id: 3, nome_item: 'Algodão', tipo_item: 'material', ativo: 1, tem_variacoes: true,
    cores: [{ quantidade_atual: 2, estoque_minimo: 3 }] },
  { id: 4, nome_item: 'Camiseta antiga', tipo_item: 'produto', ativo: 0, quantidade_atual: 0, estoque_minimo: 5 },
];
const ids = (filtro, busca) => filtrarEstoque(itens, filtro, busca).map(item => item.id);

test('trocas sucessivas mantêm dados para total, produtos, materiais e baixos', () => {
  assert.deepEqual(ids(''), [1, 2, 3]);
  assert.deepEqual(ids('produtos'), [1, 2]);
  assert.deepEqual(ids('materiais'), [3]);
  assert.deepEqual(ids('baixo'), [2, 3]);
  assert.deepEqual(ids(''), [1, 2, 3]);
  assert.equal(itens.length, 4);
});

test('inativos ficam separados dos filtros de ativos', () => {
  assert.deepEqual(ids('inativos'), [4]);
  assert.deepEqual(ids('inativos', 'camiseta'), [1, 4]);
  assert.deepEqual(ids('produtos', 'antiga'), [4]);
});

test('pesquisa por nome ignora acentos, caixa e espaços nas pontas', () => {
  assert.deepEqual(ids('', '  BASICA  '), [1]);
  assert.deepEqual(ids('materiais', 'algodao'), [3]);
  assert.deepEqual(ids('baixo', 'CALCA'), [2]);
  assert.deepEqual(ids('materiais', 'camiseta'), [1, 4]);
  assert.deepEqual(ids('', 'inexistente'), []);
  assert.deepEqual(ids('', '   '), [1, 2, 3]);
});
