import assert from 'node:assert/strict';
import { test } from 'node:test';
import { limparDadosTemporarios } from '../src/utils/dados_temporarios.js';

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
