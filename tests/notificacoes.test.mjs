import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { api } from '../src/services/api.js';
import { listarSolicitacoes, prepararAvisos, DURACAO_AVISO, marcarComoVista } from '../src/services/solicitacoesService.js';

let servidor, AvisoTopo;
before(async () => {
    servidor = await createServer({ server: { middlewareMode: true, hmr: false },
        optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
    ({ default: AvisoTopo } = await servidor.ssrLoadModule('/src/components/AvisoTopo.jsx'));
});
after(async () => { await servidor?.close(); });

test('prazo persiste ao recarregar e avisos expiram sem fechar manualmente', async t => {
    const valores = new Map();
    const anterior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { value: {
        getItem: chave => valores.get(chave) ?? null,
        setItem: (chave, valor) => valores.set(chave, valor),
    }, configurable: true });
    t.after(() => {
        if (anterior) Object.defineProperty(globalThis, 'localStorage', anterior);
        else delete globalThis.localStorage;
    });
    let agora = 10000;
    t.mock.method(Date, 'now', () => agora);
    t.mock.method(api, 'get', async () => ({ data: [
        { id: 1, status: 'aprovada' }, { id: 2, status: 'recusada' }, { id: 3, status: 'pendente' },
    ] }));
    // Carregar a Central Administrativa não inicia os avisos.
    assert.equal((await listarSolicitacoes())[0].expiraEm, undefined);
    const primeira = await listarSolicitacoes({ notificar: true });
    assert.equal(primeira[0].expiraEm, agora + DURACAO_AVISO);
    assert.equal(primeira[2].expiraEm, undefined);
    agora += 2000;
    const recarregada = await listarSolicitacoes({ notificar: true });
    assert.equal(recarregada[0].expiraEm, primeira[0].expiraEm);
    assert.equal(recarregada[0].visto, false);
    const perfil = prepararAvisos([{ id: 1, tipo: 'perfil', status: 'aprovada' }], { notificar: true })[0];
    assert.equal(perfil.expiraEm, primeira[0].expiraEm);
    agora += DURACAO_AVISO;
    const expirada = await listarSolicitacoes({ notificar: true });
    assert.equal(expirada[0].visto, true);
    assert.equal(expirada[1].visto, true);
    assert.equal(expirada[2].visto, false);
    assert.equal(prepararAvisos([{ id: 1, tipo: 'perfil', status: 'aprovada' }], { notificar: true })[0].visto, true);
    t.mock.method(api, 'patch', async () => ({}));
    await marcarComoVista(3);
    assert.equal((await listarSolicitacoes())[2].visto, true);
});

test('avisos identificam cliente e estoque sem Pedido #null', () => {
    const html = renderToString(React.createElement(AvisoTopo, { resultados: [
        { id: 1, tipo: 'edicao', clienteId: 4, pedidoId: null, resumo: 'Cliente exemplo', reativar: true, status: 'aprovada' },
        { id: 2, tipo: 'exclusao', estoqueId: 5, pedidoId: null, resumo: 'Camiseta', status: 'aprovada' },
        { id: 3, tipo: 'edicao', pedidoId: 8, status: 'recusada', motivo: 'Revisar' },
        { id: 4, tipo: 'perfil', resumo: 'Alteração de perfil', status: 'aprovada' },
        { id: 5, tipo: 'perfil', status: 'recusada', motivo: 'Revisar cadastro' },
    ] }));
    assert.match(html, /Cliente: Cliente exemplo/);
    assert.match(html, /reativação foi aprovada/);
    assert.match(html, /Estoque: Camiseta/);
    assert.match(html, /Pedido #8/);
    assert.match(html, /Alteração de perfil/);
    assert.match(html, /suas alterações foram aprovadas/);
    assert.match(html.replaceAll('<!-- -->', ''), /Motivo: Revisar cadastro/);
    assert.doesNotMatch(html, /Pedido #null|Pedido #undefined/);
});
