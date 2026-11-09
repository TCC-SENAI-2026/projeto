import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { pararCamera, comprimirFonteFoto, prepararFotoGaleria } from '../src/utils/fotoCaptura.js';

let servidor, FotoColaborador, FotoCaptura;
before(async () => {
    servidor = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)),
        server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
    ({ default: FotoColaborador } = await servidor.ssrLoadModule('/src/components/FotoColaborador.jsx'));
    ({ default: FotoCaptura } = await servidor.ssrLoadModule('/src/components/FotoCaptura.jsx'));
});
after(async () => { await servidor?.close(); });

test('foto usa rota autenticada e fallback circular com iniciais', t => {
    let html = renderToString(React.createElement(FotoColaborador, { id: 12, nome: 'Ana Silva' }));
    assert.match(html, /src="\/api\/colaboradores\/12\/foto"/);
    assert.match(html, /alt="Foto de Ana Silva"/);
    html = renderToString(React.createElement(FotoColaborador, { id: 12, nome: 'Ana Silva', temFoto: false }));
    assert.match(html, />AS</);
    assert.ok(!html.includes('<img'));
    let estado = null;
    t.mock.method(React, 'useState', () => [estado, valor => { estado = valor; }]);
    const props = { id: 12, nome: 'Ana Silva' };
    let elemento = FotoColaborador(props);
    elemento.props.children.props.onError();
    elemento = FotoColaborador(props);
    assert.equal(elemento.props.children.props.children, 'AS');
});

test('componente disponibiliza galeria nos formatos definidos e captura separada', () => {
    const html = renderToString(React.createElement(FotoCaptura, { nome: 'Ana', onChange() {} }));
    assert.match(html, /Escolher da galeria/);
    assert.match(html, /Tirar foto/);
    assert.match(html, /accept="image\/jpeg,image\/png,image\/webp"/);
    assert.ok(!html.includes('<video'));
});

test('compressão mantém proporção, limita lado maior a 512 e produz JPEG', async t => {
    const draw = [];
    const canvas = { width: 0, height: 0,
        getContext: () => ({ fillRect() {}, drawImage: (...args) => draw.push(args) }),
        toBlob: (callback, tipo, qualidade) => {
            assert.equal(tipo, 'image/jpeg');
            assert.equal(qualidade, 0.85);
            callback(new Blob(['jpeg-simulado'], { type: tipo }));
        },
    };
    const anterior = globalThis.document;
    globalThis.document = { createElement: () => canvas };
    t.after(() => { if (anterior === undefined) delete globalThis.document; else globalThis.document = anterior; });
    const file = await comprimirFonteFoto({}, 2000, 1000);
    assert.equal(canvas.width, 512);
    assert.equal(canvas.height, 256);
    assert.equal(file.type, 'image/jpeg');
    assert.equal(file.name, 'foto.jpg');
    assert.equal(draw.length, 1);
    await comprimirFonteFoto({}, 100, 200);
    assert.equal(canvas.width, 100);
    assert.equal(canvas.height, 200);
});

test('galeria rejeita formato fora de JPEG PNG WebP e parada encerra todos os tracks', async t => {
    await assert.rejects(prepararFotoGaleria(new File(['x'], 'foto.gif', { type: 'image/gif' })), /JPEG, PNG ou WebP/);
    let parados = 0;
    pararCamera({ getTracks: () => [{ stop: () => parados++ }, { stop: () => parados++ }] });
    assert.equal(parados, 2);
    pararCamera(null);
});
