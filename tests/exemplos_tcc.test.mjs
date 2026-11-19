import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filtrarColaboradores } from '../src/utils/filtros.js';
import { mascaraCep } from '../src/utils/formatacao.js';
import { avisoSaldo } from '../src/utils/produtosEstoque.js';

test('Estoque zerado recebe o aviso de falta de estoque', () => {
    const produto = { quantidade_atual: 0, estoque_minimo: 5 };

    assert.equal(avisoSaldo(produto).trim(), '(sem estoque)');
});

test('Saldo igual ao mínimo recebe o aviso de estoque baixo', () => {
    const produto = { quantidade_atual: 5, estoque_minimo: 5 };

    assert.equal(avisoSaldo(produto).trim(), '(estoque baixo)');
});

test('A busca encontra o colaborador pelo nome sem acento', () => {
    const joao = { nome_completo: 'João Silva', re: '100001', ativo: true };
    const ana = { nome_completo: 'Ana Souza', re: '100002', ativo: true };

    assert.deepEqual(filtrarColaboradores([joao, ana], 'Todos', 'joao'), [joao]);
});

test('A formatação do CEP preserva o zero inicial', () => {
    assert.equal(mascaraCep('01234567'), '01234-567');
});
