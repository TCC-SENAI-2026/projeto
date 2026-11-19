import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    guardarArteRascunhoPedido, guardarRascunhoPedido, lerArtesRascunhoPedido,
    lerRascunhoPedido, limparDadosTemporarios,
} from '../src/utils/dados_temporarios.js';

test('mantém identificação, produtos e arte até limpar o rascunho', t => {
    const dados = new Map();
    const anterior = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
        getItem: chave => dados.get(chave) ?? null,
        setItem: (chave, valor) => dados.set(chave, valor),
        removeItem: chave => dados.delete(chave),
    } });
    t.after(() => {
        if (anterior) Object.defineProperty(globalThis, 'sessionStorage', anterior);
        else delete globalThis.sessionStorage;
    });

    const identificacao = { nomeCliente: 'Cliente', dataPedido: '2026-11-19', prazoEntrega: '2026-11-30' };
    const produtos = { 1: { selecionado: true, quantidades: { M: 2 } } };
    const arte = { file: new File(['arte'], 'arte.png') };
    guardarRascunhoPedido('identificacaoPedido', identificacao);
    guardarRascunhoPedido('produtosRascunhoPedido', produtos);
    guardarArteRascunhoPedido(1, arte);
    assert.deepEqual(lerRascunhoPedido('identificacaoPedido', {}), identificacao);
    assert.deepEqual(lerRascunhoPedido('produtosRascunhoPedido', {}), produtos);
    assert.equal(lerArtesRascunhoPedido()[1], arte);

    limparDadosTemporarios();
    assert.equal(dados.size, 0);
    assert.deepEqual(lerArtesRascunhoPedido(), {});
});

test('troca de conta limpa rascunhos e preserva histórico de notificações', () => {
    const dados = new Map(['dadosFicha', 'detalhesPedido', 'solicitacoes_vistas', 'solicitacoes_prazos_avisos', 'preferencia-outra'].map(k => [k, 'valor']));
    const anterior = globalThis.localStorage;
    globalThis.localStorage = { removeItem: chave => dados.delete(chave) };
    try {
        limparDadosTemporarios();
        assert.deepEqual([...dados.keys()], ['solicitacoes_vistas', 'solicitacoes_prazos_avisos', 'preferencia-outra']);
    } finally { globalThis.localStorage = anterior; }
});

test('armazenamento bloqueado não impede encerrar sessão', () => {
    const anterior = globalThis.localStorage;
    globalThis.localStorage = { removeItem() { throw new Error('Bloqueado'); } };
    try { assert.doesNotThrow(limparDadosTemporarios); }
    finally { globalThis.localStorage = anterior; }
});
