import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { nomeTecidoCor, selecionarTecidoCor } from '../src/utils/tecidosEstoque.js';

const tecidos = [
    { id: 6, nome_item: 'Algodão', cores: [
        { id: 101, nome_cor: 'Preto', quantidade_atual: '10', estoque_minimo: '2' },
        { id: 102, nome_cor: 'Branco', quantidade_atual: '0', estoque_minimo: '2' },
    ] },
    { id: 9, nome_item: 'Poliéster', cores: [
        { id: 103, nome_cor: 'Preto', quantidade_atual: '1', estoque_minimo: '2' },
    ] },
    { id: 10, nome_item: 'Sem cores', cores: [] },
];

let servidor, SelectTecidoCor, FichaConteudo;
before(async () => {
    servidor = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)),
        server: { middlewareMode: true }, appType: 'custom' });
    ({ default: SelectTecidoCor } = await servidor.ssrLoadModule('/src/components/SelectTecidoCor.jsx'));
    ({ default: FichaConteudo } = await servidor.ssrLoadModule('/src/components/FichaConteudo.jsx'));
});
after(async () => { await servidor?.close(); });

const h = React.createElement;
function select(props = {}) {
    return renderToString(h(MemoryRouter, null, h(SelectTecidoCor, {
        tecidos, carregando: false, erro: '', detalhes: {}, onChange() {}, ...props,
    })));
}

test('uma escolha identifica tecido e cor mesmo quando nomes de cor se repetem', () => {
    assert.deepEqual(selecionarTecidoCor(tecidos, '103'), {
        material_id: 9, material_cor_id: 103, tecido: 'Poliéster', cor: 'Preto',
    });
    assert.equal(selecionarTecidoCor(tecidos, '102').material_id, null);
    assert.equal(selecionarTecidoCor(tecidos, '').material_cor_id, null);
    assert.equal(nomeTecidoCor(selecionarTecidoCor(tecidos, '101')), 'Algodão · Preto');
});

test('select único tem grupos por tecido, saldos e texto selecionado completo', () => {
    const html = select({ detalhes: selecionarTecidoCor(tecidos, 101) });
    assert.equal((html.match(/<select\b/g) || []).length, 1);
    assert.match(html, /optgroup label="Algodão"/);
    assert.match(html, /optgroup label="Sem cores" disabled/);
    assert.match(html, /option value="102" disabled/);
    assert.match(html, /\(sem estoque\)/);
    assert.match(html, /\(estoque baixo\)/);
    assert.match(html, /selected="">Algodão · Preto/);
    assert.ok(!html.includes('Básicos'));
    assert.ok(!html.includes('>Cor</label>'));
});

test('ausência de tecidos orienta para Materiais sem criar opções fixas', () => {
    const html = select({ tecidos: [] });
    assert.match(html, /Nenhum tecido disponível/);
    assert.match(html, /href="\/estoque\?filtro=materiais"/);
    assert.equal((html.match(/<optgroup/g) || []).length, 0);
});

test('vínculo existente é somente leitura mesmo com cor zerada ou tecido fora da lista', () => {
    const html = select({ tecidos: [], bloqueado: true, detalhes: { tecido: 'Linho antigo', cor: 'Bege' } });
    assert.match(html, /readOnly="" value="Linho antigo · Bege"/);
    assert.ok(!html.includes('<select'));
});

test('ficha mostra Tecido · Cor nos itens novos e nos legados', () => {
    const html = renderToString(h(FichaConteudo, { ficha: {}, pedido: { produtos: [
        { item: 'Produto novo', detalhes: selecionarTecidoCor(tecidos, 101), grade: { M: 2 } },
        { item: 'Modelo legado', detalhes: { tecido: 'Seda', cor: 'Azul' }, grade: { P: 1 } },
    ] } }));
    assert.match(html, /Algodão · Preto/);
    assert.match(html, /Seda · Azul/);
});

test('ficha mantém observação geral e texto legado sem criar campo vazio para item novo', () => {
    const novo = renderToString(h(FichaConteudo, {
        ficha: { observacao: 'Entrega urgente' },
        pedido: { produtos: [{ item: 'Novo', detalhes: {}, grade: { M: 1 } }] },
    }));
    assert.match(novo, /Entrega urgente/);
    assert.ok(!novo.includes('fc-produto-obs'));
    const antigo = renderToString(h(FichaConteudo, {
        ficha: { observacao: 'Entrega urgente' },
        pedido: { produtos: [{ item: 'Legado', detalhes: { observacao: 'Texto histórico' }, grade: { M: 1 } }] },
    }));
    assert.match(antigo, /Entrega urgente/);
    assert.match(antigo, /Texto histórico/);
});
