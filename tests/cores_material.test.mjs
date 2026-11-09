import assert from 'node:assert/strict';
import { test } from 'node:test';
import { novaCorMaterial, prepararCoresMaterial } from '../src/utils/coresMaterial.js';

test('ignora linhas vazias e preserva ids na lista completa de edição', () => {
    const existentes = [
        { id: 1, nome_cor: ' Preto ', quantidade_atual: '10.50', estoque_minimo: '' },
        { id: 2, nome_cor: 'Branco', quantidade_atual: 0, estoque_minimo: '1.25' },
        { nome_cor: 'Azul', quantidade_atual: '3,75', estoque_minimo: '' },
        novaCorMaterial(),
    ];
    assert.deepEqual(prepararCoresMaterial(existentes), [
        { id: 1, nome_cor: 'Preto', quantidade_atual: '10.50', estoque_minimo: '0' },
        { id: 2, nome_cor: 'Branco', quantidade_atual: '0', estoque_minimo: '1.25' },
        { nome_cor: 'Azul', quantidade_atual: '3.75', estoque_minimo: '0' },
    ]);
    assert.equal(existentes[0].nome_cor, ' Preto ');
});

test('exige uma cor e rejeita nomes repetidos ignorando caixa e espaços', () => {
    assert.throws(() => prepararCoresMaterial([novaCorMaterial()]), /ao menos uma cor/);
    assert.throws(() => prepararCoresMaterial([
        { nome_cor: 'Preto' }, { nome_cor: ' PRETO ' },
    ]), /repetidos/);
    assert.throws(() => prepararCoresMaterial([{ nome_cor: '', quantidade_atual: 2 }]), /nome/);
});

test('rejeita metros negativos, inválidos ou com precisão excessiva', () => {
    for (const quantidade_atual of ['-1', 'NaN', 'Infinity', '0.001', '100000000']) {
        assert.throws(() => prepararCoresMaterial([{ nome_cor: 'Azul', quantidade_atual }]), /casas decimais/);
    }
});
