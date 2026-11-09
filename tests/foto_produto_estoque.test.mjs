import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

let servidor, FotoProdutoEstoque;
before(async () => {
    servidor = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)),
        server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
    ({ default: FotoProdutoEstoque } = await servidor.ssrLoadModule('/src/components/FotoProdutoEstoque.jsx'));
});
after(async () => { await servidor?.close(); });

test('foto usa rota existente, nome do produto no alt e dimensões do ícone', () => {
    const html = renderToString(React.createElement(FotoProdutoEstoque, {
        estoqueId: 12, nome: 'Camiseta Evento', temImagem: true,
    }));
    assert.match(html, /src="\/api\/estoque\/12\/imagem"/);
    assert.match(html, /alt="Camiseta Evento"/);
    assert.match(html, /width="52" height="52"/);
    assert.ok(!html.includes('checkroom'));
});

test('produto sem foto mantém ícone no mesmo contêiner', () => {
    const html = renderToString(React.createElement(FotoProdutoEstoque, {
        estoqueId: 12, nome: 'Sem foto', temImagem: false,
    }));
    assert.match(html, /class="modelo-icon"/);
    assert.match(html, /checkroom/);
    assert.ok(!html.includes('<img'));
});

test('erro de carregamento cai no ícone; mudança de produto permite carregar outra foto', t => {
    // Simula apenas o estado do hook e o evento; não usa DOM/navegador real.
    let estado = null;
    t.mock.method(React, 'useState', () => [estado, valor => { estado = valor; }]);
    const props = { estoqueId: 12, nome: 'Produto com foto', temImagem: true };
    let elemento = FotoProdutoEstoque(props);
    assert.equal(elemento.props.children.type, 'img');
    elemento.props.children.props.onError();
    elemento = FotoProdutoEstoque(props);
    assert.equal(elemento.props.children.type, 'span');
    assert.equal(elemento.props.children.props.children, 'checkroom');
    elemento = FotoProdutoEstoque({ ...props, estoqueId: 15 });
    assert.equal(elemento.props.children.type, 'img');
    assert.equal(elemento.props.children.props.src, '/api/estoque/15/imagem');
});
