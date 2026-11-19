import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api } from '../src/services/api.js';
import { definirContaAvisos, listarSolicitacoes, prepararAvisos, marcarComoVista, DURACAO_AVISO } from '../src/services/solicitacoesService.js';
import { limparDadosTemporarios } from '../src/utils/dados_temporarios.js';

test('aviso expirado não reaparece ao sair, entrar e abrir o perfil novamente', async t => {
    const dados = new Map();
    const anterior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
        getItem: chave => dados.get(chave) ?? null,
        setItem: (chave, valor) => dados.set(chave, valor),
        removeItem: chave => dados.delete(chave),
    } });
    t.after(() => {
        definirContaAvisos(null);
        if (anterior) Object.defineProperty(globalThis, 'localStorage', anterior);
        else delete globalThis.localStorage;
    });
    let agora = 10000;
    t.mock.method(Date, 'now', () => agora);
    t.mock.method(api, 'patch', async () => ({}));
    const ler = () => prepararAvisos([{ id: 50, tipo: 'perfil', status: 'aprovada' }], { notificar: true })[0];
    definirContaAvisos(1);
    assert.equal(ler().visto, false);
    agora += DURACAO_AVISO;
    await marcarComoVista(50);
    assert.equal(ler().visto, true);
    limparDadosTemporarios();
    definirContaAvisos(null);
    definirContaAvisos(1);
    assert.equal(ler().visto, true);
    // Outra conta possui seu próprio histórico, mesmo para a mesma solicitação.
    definirContaAvisos(2);
    assert.equal(ler().visto, false);
    definirContaAvisos(1);
    assert.equal(ler().visto, true);
    // Se saiu antes do timer executar, o prazo salvo também evita reaparecimento.
    const aviso = [{ id: 51, status: 'recusada' }];
    prepararAvisos(aviso, { notificar: true });
    limparDadosTemporarios();
    definirContaAvisos(null);
    agora += DURACAO_AVISO;
    definirContaAvisos(1);
    assert.equal(prepararAvisos(aviso, { notificar: true })[0].visto, true);
    // Uma decisão nova continua aparecendo normalmente.
    assert.equal(prepararAvisos([{ id: 52, status: 'aprovada' }], { notificar: true })[0].visto, false);
});

test('avisos consultam apenas solicitações próprias e descartam respostas da conta anterior', async t => {
    definirContaAvisos(1);
    t.after(() => definirContaAvisos(null));
    let responder;
    const buscar = t.mock.method(api, 'get', () => new Promise(resolve => { responder = resolve; }));
    const consulta = listarSolicitacoes({ notificar: true });
    assert.deepEqual(buscar.mock.calls[0].arguments, ['/solicitacoes?escopo=minhas']);

    definirContaAvisos(2);
    responder({ data: [{ id: 50, status: 'aprovada' }] });
    assert.deepEqual(await consulta, []);

    const consultaNova = listarSolicitacoes({ notificar: true });
    responder({ data: [] });
    assert.deepEqual(await consultaNova, []);
});
