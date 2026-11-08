import assert from 'node:assert/strict';
import { test } from 'node:test';
import { avisoSaldo, locaisProdutoPedido } from '../src/utils/produtosEstoque.js';
import { api, clearCsrfToken } from '../src/services/api.js';
import { buscarPedido, salvarPedido, atualizarPedido } from '../src/services/pedidosService.js';

test('sem saldo e estoque baixo são distintos, inclusive com decimais vindos da API', () => {
    assert.equal(avisoSaldo({ quantidade_atual: '0.00', estoque_minimo: '2' }), ' (sem estoque)');
    assert.equal(avisoSaldo({ quantidade_atual: '2.00', estoque_minimo: '2' }), ' (estoque baixo)');
    assert.equal(avisoSaldo({ quantidade_atual: '3', estoque_minimo: '2' }), '');
});

test('produto novo chamado Camiseta aceita locais completos; legado conserva restrições', () => {
    const novo = locaisProdutoPedido({ item: 'Camiseta', detalhes: { tipo_produto_id: null } });
    const legado = locaisProdutoPedido({ item: 'Camiseta', detalhes: { tipo_produto_id: 1 } });
    assert.ok(novo.flatMap(g => g.options).includes('Capuz'));
    assert.ok(!legado.flatMap(g => g.options).includes('Capuz'));
});

test('revisão envia estoque_id e reabertura preserva id de estoque e catálogo nulo', async t => {
    clearCsrfToken();
    t.after(clearCsrfToken);
    const chamadas = [];
    const respostas = [
        { csrf_token: 'teste-isolado' },
        { success: true, data: { id: 12 } },
        { success: true, data: { id: 12, status: 'pendente', obs_geral: 'Entrega urgente', itens: [
            { id: 30, estoque_id: 42, tipo_produto_id: null, material_id: 6, material_cor_id: 101, tipo_produto: 'Produto personalizado', observacao: 'Texto histórico', tamanhos: [] },
        ] } },
        { success: true },
    ];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        chamadas.push({ url, options });
        assert.ok(respostas.length, 'Não deve haver consultas adicionais ao catálogo.');
        return Response.json(respostas.shift());
    });
    await salvarPedido({
        ficha: { cliente: 'Cliente Teste', dataPedido: '2026-11-08', observacao: 'Entrega urgente' },
        pedido: { produtos: [{ item: 'Produto personalizado', estoque_id: 42, grade: { M: 3 },
            detalhes: { material_id: 6, material_cor_id: 101, tecido: 'Algodão', cor: 'Preto', local: 'Capuz', observacao: 'Não enviar' } }] },
    });
    const payload = JSON.parse(chamadas[1].options.body.get('dados'));
    assert.equal(payload.produtos[0].estoque_id, 42);
    assert.equal(payload.produtos[0].detalhes.material_id, 6);
    assert.equal(payload.produtos[0].detalhes.material_cor_id, 101);
    assert.equal(payload.produtos[0].item, 'Produto personalizado');
    assert.equal(payload.obs_geral, 'Entrega urgente');
    assert.ok(!Object.hasOwn(payload.produtos[0].detalhes, 'observacao'));
    const reaberto = await buscarPedido(12);
    assert.equal(reaberto.pedido.produtos[0].estoque_id, 42);
    assert.equal(reaberto.pedido.produtos[0].detalhes.estoque_id, 42);
    assert.equal(reaberto.pedido.produtos[0].detalhes.tipo_produto_id, null);
    assert.equal(reaberto.pedido.produtos[0].detalhes.material_cor_id, 101);
    await atualizarPedido(12, reaberto);
    const editado = JSON.parse(chamadas[3].options.body);
    assert.equal(editado.pedido.produtos[0].estoque_id, 42);
    assert.equal(editado.ficha.observacao, 'Entrega urgente');
    assert.ok(!Object.hasOwn(editado.pedido.produtos[0].detalhes, 'observacao'));
    assert.equal(reaberto.pedido.produtos[0].detalhes.observacao, 'Texto histórico');
});

test('reabertura de pedido antigo mantém nome do catálogo e ausência de estoque', async t => {
    t.mock.method(api, 'get', async () => ({ data: { id: 1, itens: [
        { id: 4, tipo_produto: 'Camisa Longa', tipo_produto_id: 8, estoque_id: null, tamanhos: [] },
    ] } }));
    const antigo = await buscarPedido(1);
    assert.equal(antigo.pedido.produtos[0].item, 'Camisa Longa');
    assert.equal(antigo.pedido.produtos[0].estoque_id, null);
    assert.equal(antigo.pedido.produtos[0].detalhes.tipo_produto_id, 8);
});
