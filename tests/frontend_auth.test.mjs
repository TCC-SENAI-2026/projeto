/**
 * Execute na raiz: node --test tests/frontend_auth.test.mjs
 *
 * Testes isolados: fetch e perfis são simulados. Nenhum servidor Flask,
 * conexão MySQL ou conta real é utilizado. O Vite somente transforma JSX
 * em memória, sem abrir uma porta HTTP. SSR não executa efeitos do navegador;
 * sessão/cookie real e redirecionamento visual pertencem à etapa C.
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createServer } from 'vite';
import { api, ApiError, clearCsrfToken } from '../src/services/api.js';

let servidor;
let AuthContext;
let Sidebar;
let App;
let ProtectedRoute;
let SessionStatus;
const h = React.createElement;

before(async () => {
  servidor = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true },
    appType: 'custom',
  });
  ({ AuthContext } = await servidor.ssrLoadModule('/src/auth/AuthContext.js'));
  ({ default: Sidebar } = await servidor.ssrLoadModule('/src/components/Sidebar.jsx'));
  ({ default: ProtectedRoute } = await servidor.ssrLoadModule('/src/auth/ProtectedRoute.jsx'));
  ({ default: SessionStatus } = await servidor.ssrLoadModule('/src/auth/SessionStatus.jsx'));
  ({ default: App } = await servidor.ssrLoadModule('/src/App.jsx'));
});

after(async () => {
  await servidor?.close();
});

function simularFetch(t, respostas) {
  clearCsrfToken();
  const fila = [...respostas];
  const chamadas = [];
  t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
    chamadas.push({ url, ...opcoes });
    assert.ok(fila.length, `Chamada inesperada: ${url}`);
    const resposta = fila.shift();
    if (resposta instanceof Error) throw resposta;
    if (resposta instanceof Response) return resposta;
    return Response.json(resposta.body, { status: resposta.status ?? 200 });
  });
  t.after(() => {
    clearCsrfToken();
    assert.equal(fila.length, 0, 'Todas as respostas simuladas devem ser consumidas.');
  });
  return chamadas;
}

function colaborador(nivel_acesso) {
  return {
    id: nivel_acesso === 'administrador' ? 1 : 2,
    re: nivel_acesso === 'administrador' ? 'RE-ADMIN-SIMULADO' : 'RE-COLAB-SIMULADO',
    nome: nivel_acesso === 'administrador' ? 'Ana Silva' : 'Bruno Costa',
    nivel_acesso,
  };
}

function renderizar(usuario, elemento, caminho = '/home', estado = {}) {
  const contexto = {
    status: usuario ? 'authenticated' : 'anonymous',
    colaborador: usuario,
    ...estado,
  };
  return renderToString(h(AuthContext.Provider, { value: contexto },
    h(MemoryRouter, { initialEntries: [caminho] }, elemento)));
}

describe('Cliente HTTP de autenticação (fetch simulado)', { concurrency: false }, () => {
  test('login obtém CSRF, usa RE e adota token renovado de /me no logout', async (t) => {
    const perfil = { ...colaborador('administrador'), csrf_token: 'csrf-confirmado-me' };
    const chamadas = simularFetch(t, [
      { body: { csrf_token: 'csrf-anonimo' } },
      { body: { success: true, csrf_token: 'csrf-apos-login' } },
      { body: perfil },
      { body: { success: true } },
    ]);

    await api.post('/login', { re: perfil.re, senha: 'somente-valor-simulado' });
    assert.deepEqual(await api.get('/me'), perfil);
    await api.post('/logout');

    assert.deepEqual(chamadas.map(({ url }) => url), [
      '/api/csrf', '/api/login', '/api/me', '/api/logout',
    ]);
    assert.ok(chamadas.every(({ credentials }) => credentials === 'same-origin'));
    assert.equal(chamadas[1].headers['X-CSRF-Token'], 'csrf-anonimo');
    assert.equal(chamadas[3].headers['X-CSRF-Token'], 'csrf-confirmado-me');
    assert.equal(chamadas[1].headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(chamadas[1].body), {
      re: perfil.re, senha: 'somente-valor-simulado',
    });
    assert.equal(chamadas[2].headers['X-CSRF-Token'], undefined);
  });

  test('consulta /me após recarregar recupera perfil e CSRF sem outro login', async (t) => {
    const perfil = { ...colaborador('colaborador'), csrf_token: 'csrf-sessao-restaurada' };
    const chamadas = simularFetch(t, [
      { body: perfil },
      { body: { success: true } },
    ]);

    // simularFetch apaga apenas a memória do cliente, como uma nova carga da SPA.
    assert.deepEqual(await api.get('/me'), perfil);
    await api.post('/logout');
    assert.deepEqual(chamadas.map(({ url }) => url), ['/api/me', '/api/logout']);
    assert.equal(chamadas[1].headers['X-CSRF-Token'], 'csrf-sessao-restaurada');
  });

  test('403 descarta CSRF antigo e não repete a mutação automaticamente', async (t) => {
    const chamadas = simularFetch(t, [
      { body: { csrf_token: 'csrf-antigo' } },
      { status: 403, body: { success: false, msg: 'CSRF inválido.' } },
      { body: { csrf_token: 'csrf-novo' } },
      { body: { success: true } },
    ]);

    await assert.rejects(api.post('/logout'), (erro) => erro.status === 403);
    assert.equal(chamadas.length, 2, 'Erro não deve disparar logout repetido.');
    await api.post('/logout');
    assert.equal(chamadas[2].url, '/api/csrf');
    assert.equal(chamadas[3].headers['X-CSRF-Token'], 'csrf-novo');
  });

  test('falha de rede difere de sessão ausente (401)', async (t) => {
    simularFetch(t, [
      new TypeError('Falha de rede simulada.'),
      { status: 401, body: { success: false, msg: 'Autenticação necessária.' } },
    ]);

    await assert.rejects(api.get('/me'), (erro) => erro instanceof ApiError
      && erro.status === null && erro.message.includes('conectar'));
    await assert.rejects(api.get('/me'), (erro) => erro instanceof ApiError
      && erro.status === 401 && erro.message === 'Autenticação necessária.');
  });

  test('merge preserva listas, uploads, PATCH e mensagens dos módulos antigos', async (t) => {
    const chamadas = simularFetch(t, [
      { body: [{ id: 1 }] },
      { body: [] },
      { body: { csrf_token: 'token-merge' } },
      { body: { success: true } },
      { body: { success: true } },
      { body: { success: true } },
      { body: { message: 'Estoque inválido.' }, status: 400 },
    ]);
    assert.deepEqual(await api.get('/listar-estoque', { lista: true }), [{ id: 1 }]);
    await assert.rejects(api.get('/me'), /resposta inválida/);
    const form = new FormData();
    form.append('nome', 'Cliente');
    await api.post('/cadastrar-cliente', form);
    await api.postFile('/pedidos', form);
    await api.patch('/pedidos/1/status', { status: 'concluido' });
    await assert.rejects(api.put('/editar-estoque/1', {}), (erro) =>
      erro instanceof ApiError && erro.status === 400 && erro.message === 'Estoque inválido.');
    for (const chamada of chamadas.slice(3)) {
      assert.equal(chamada.headers['X-CSRF-Token'], 'token-merge');
      assert.equal(chamada.credentials, 'same-origin');
    }
    for (const chamada of chamadas.slice(3, 5)) {
      assert.equal(chamada.body, form);
      assert.equal(chamada.headers['Content-Type'], undefined);
    }
    assert.equal(chamadas[5].method, 'PATCH');
    assert.equal(chamadas[5].body, JSON.stringify({ status: 'concluido' }));
  });

  test('PUT de arquivo e listagem por POST preservam cookie e CSRF', async (t) => {
    const chamadas = simularFetch(t, [
      { body: { csrf_token: 'token-estoque' } },
      { body: { success: true } },
      { body: [{ estoque_id: 1, disponivel: true }] },
    ]);
    const form = new FormData();
    form.append('nome_item', 'Camiseta');
    await api.putFile('/editar-estoque/1', form);
    const disponibilidade = await api.post('/estoque/verificar-disponibilidade',
      { itens: [{ estoque_id: 1, quantidade: 2 }] }, { lista: true });
    assert.equal(disponibilidade[0].disponivel, true);
    assert.equal(chamadas[1].method, 'PUT');
    assert.equal(chamadas[1].body, form);
    assert.equal(chamadas[1].headers['Content-Type'], undefined);
    for (const chamada of chamadas.slice(1)) {
      assert.equal(chamada.headers['X-CSRF-Token'], 'token-estoque');
      assert.equal(chamada.credentials, 'same-origin');
    }
  });

  test('resposta inválida e ausência de token impedem conexão insegura', async (t) => {
    const chamadas = simularFetch(t, [
      new Response('<html>Erro do proxy</html>', { status: 502 }),
      { body: null },
      { body: {} },
    ]);

    await assert.rejects(api.get('/me'), (erro) => erro.status === 502);
    await assert.rejects(api.get('/me'), /resposta inválida/);
    await assert.rejects(api.post('/login', { re: 'RE-SIMULADO', senha: 'simulada' }),
      /conexão segura/);
    assert.deepEqual(chamadas.map(({ url }) => url), ['/api/me', '/api/me', '/api/csrf']);
  });
});

describe('Menu lateral com perfis simulados', () => {
  test('administrador visualiza todas as áreas e nome/perfil vindos da sessão', () => {
    const html = renderizar(colaborador('administrador'), h(Sidebar));
    for (const nome of ['Inicio', 'Pedidos', 'Estoque', 'Clientes', 'Colaboradores',
      'Relatorios', 'Painel Adm', 'Perfil']) {
      assert.ok(html.includes(nome), `Administrador deve visualizar ${nome}.`);
    }
    assert.match(html, /user-name[^>]*>Ana Silva</);
    assert.match(html, /user-role[^>]*>Administrador</);
    assert.match(html, /user-avatar[^>]*>AS</);
  });

  test('colaborador visualiza somente as quatro áreas autorizadas', () => {
    const html = renderizar(colaborador('colaborador'), h(Sidebar));
    for (const nome of ['Inicio', 'Pedidos', 'Estoque', 'Clientes']) {
      assert.ok(html.includes(nome), `Colaborador deve visualizar ${nome}.`);
    }
    for (const nome of ['Colaboradores', 'Relatorios', 'Painel Adm', 'Perfil']) {
      assert.ok(!html.includes(nome), `Colaborador não deve visualizar ${nome}.`);
    }
    assert.match(html, /user-name[^>]*>Bruno Costa</);
    assert.match(html, /user-role[^>]*>Colaborador</);
    assert.match(html, /user-avatar[^>]*>BC</);
    assert.ok(!html.includes('Ana Silva'));
  });
});

describe('Guardas React e rotas reais do App', () => {
  test('guarda comum permite colaborador autenticado e bloqueia sessão ausente', () => {
    const rota = h(Routes, null,
      h(Route, { element: h(ProtectedRoute) },
        h(Route, { path: '/area-comum', element: h('span', null, 'CONTEUDO_COMUM') })));
    assert.ok(renderizar(colaborador('colaborador'), rota, '/area-comum').includes('CONTEUDO_COMUM'));
    assert.ok(!renderizar(null, rota, '/area-comum').includes('CONTEUDO_COMUM'));
  });

  // Usa o App real, para detectar também uma rota acidentalmente fora da guarda.
  for (const [caminho, titulo] of [
    ['/equipe', 'Colaboradores'],
    ['/painel-adm', 'Central Administrativa'],
    ['/relatorio', 'Relatórios'],
  ]) {
    test(`${caminho}: administrador monta a tela`, () => {
      const html = renderizar(colaborador('administrador'), h(App), caminho);
      assert.match(html, new RegExp(`<h1[^>]*>${titulo}</h1>`));
    });

    for (const perfil of ['colaborador', null]) {
      test(`${caminho}: ${perfil ?? 'sessão ausente'} não monta a tela`, () => {
        const usuario = perfil ? colaborador(perfil) : null;
        const html = renderizar(usuario, h(App), caminho);
        // Navigate só executa o redirecionamento no navegador; em SSR ele não monta a página.
        assert.ok(!html.includes(titulo));
        assert.doesNotMatch(html, /<h1/);
        assert.doesNotMatch(html, /class="sidebar/);
      });
    }
  }

  test('falha inicial informa erro e nova tentativa sem montar telas protegidas', () => {
    const html = renderizar(null, h(App), '/equipe', {
      status: 'error', erro: 'Falha de conexão simulada.',
    });
    assert.ok(html.includes('Falha de conexão simulada.'));
    assert.ok(html.includes('Tentar novamente'));
    assert.ok(!html.includes('Colaboradores'));
  });

  test('carregamento inicial apresenta confirmação da sessão', () => {
    const html = renderizar(null, h(SessionStatus), '/', { status: 'loading' });
    assert.ok(html.includes('Verificando sessão...'));
    assert.ok(!html.includes('Tentar novamente'));
  });
});
