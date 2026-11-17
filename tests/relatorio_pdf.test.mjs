import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { gerarRelatorioProducao } from '../src/services/gerar_relatorio_producao.js';

const base = { ano: 2026, mes: 11, producao_total: 120, pedidos_concluidos: 3,
    pedidos_pendentes: 4, pedidos_em_producao: 2, estoque_baixo: 1,
    producao: [{ mes: 1, total: 50 }, { mes: 11, total: 120 }, { mes: 12, total: 999 }] };

test('PDF inclui logo, duas páginas e total anual sem contar meses futuros', () => {
    const logo = new Uint8Array(readFileSync(new URL('../public/img/logo.png', import.meta.url)));
    const { doc, nomeArquivo } = gerarRelatorioProducao(base, { logo, emitidoEm: new Date('2026-11-15T15:00:00Z') });
    assert.equal(nomeArquivo, 'relatorio-producao-2026-11.pdf');
    assert.equal(doc.getNumberOfPages(), 2);
    const tabela = doc.lastAutoTable;
    assert.equal(tabela.body.length, 12);
    assert.equal(tabela.body[10].cells[1].raw, '120');
    assert.equal(tabela.body[10].cells[2].raw, 'Parcial');
    assert.equal(tabela.body[11].cells[1].raw, '—');
    assert.equal(tabela.foot[0].cells[1].raw, '170');
    assert.ok(tabela.finalY + 44 < 286, 'Notas devem terminar antes do rodapé');
    assert.match(doc.output(), /%PDF-/);
    assert.ok(Object.keys(doc.internal.collections.addImage_images).length > 0);
});

test('janeiro sem produção gera zeros, futuros sem apuração e mantém duas páginas', () => {
    const { doc } = gerarRelatorioProducao({ ...base, mes: 1, producao_total: 0, producao: [] });
    assert.equal(doc.getNumberOfPages(), 2);
    assert.equal(doc.lastAutoTable.body[0].cells[1].raw, '0');
    assert.equal(doc.lastAutoTable.body[1].cells[1].raw, '—');
    assert.equal(doc.lastAutoTable.foot[0].cells[1].raw, '0');
});

test('dezembro apresenta todos os meses e formata quantidades brasileiras', () => {
    const { doc } = gerarRelatorioProducao({ ...base, mes: 12, producao: [{ mes: 12, total: 12000 }] });
    assert.equal(doc.lastAutoTable.body[11].cells[1].raw, '12.000');
    assert.equal(doc.lastAutoTable.foot[0].cells[1].raw, '12.000');
    assert.equal(doc.getNumberOfPages(), 2);
});

test('gráfico tem escala mínima de 100 e quantidade abaixo da coluna', () => {
    const { doc } = gerarRelatorioProducao({ ...base, mes: 1, producao: [{ mes: 1, total: 7 }] });
    const textos = doc.internal.pages[1];
    assert.ok(textos.some(texto => texto.includes('(100) Tj')));
    const quantidade = textos.find(texto => texto.includes('(7) Tj'));
    assert.ok(quantidade);
    const coordenadas = quantidade.match(/([\d.]+) ([\d.]+) Td/);
    const yEmMilimetros = (doc.internal.pageSize.getHeight() * doc.internal.scaleFactor - Number(coordenadas[2])) / doc.internal.scaleFactor;
    assert.ok(Math.abs(yEmMilimetros - 209) < 0.01, 'Quantidade deve ficar abaixo da base das barras, em 204 mm');
});

test('escala cresce quando a produção ultrapassa 100', () => {
    const { doc } = gerarRelatorioProducao({ ...base, producao: [{ mes: 1, total: 237 }] });
    assert.ok(doc.internal.pages[1].some(texto => texto.includes('(300) Tj')));
});
