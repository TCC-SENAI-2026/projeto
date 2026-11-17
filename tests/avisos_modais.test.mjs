import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarFilaAvisos } from '../src/utils/fila_avisos.js';

test('aviso aguarda fechar antes de seguir para o redirecionamento', async () => {
    let atual;
    let navegou = false;
    const fila = criarFilaAvisos(aviso => { atual = aviso; });
    const salvar = async () => {
        await fila.abrir('Item cadastrado com sucesso!');
        navegou = true;
    };
    const resultado = salvar();
    assert.equal(navegou, false);
    assert.equal(atual.mensagem, 'Item cadastrado com sucesso!');
    fila.fechar(true);
    await resultado;
    assert.equal(navegou, true);
    assert.equal(atual, null);
});

test('cancelar ou fechar a confirmação impede a ação e confirmar permite', async () => {
    const fila = criarFilaAvisos(() => {});
    for (const resposta of [false, true]) {
        const resultado = fila.abrir('Finalizar o pedido?', true);
        fila.fechar(resposta);
        assert.equal(await resultado, resposta);
    }
    const escape = fila.abrir('Finalizar o pedido?', true);
    fila.fechar();
    assert.equal(await escape, false);
});

test('mensagens simultâneas são exibidas em ordem sem perder suas respostas', async () => {
    let atual;
    const fila = criarFilaAvisos(aviso => { atual = aviso; });
    const primeiro = fila.abrir('CEP não encontrado.');
    const segundo = fila.abrir('Não foi possível salvar o cliente.');
    assert.equal(atual.mensagem, 'CEP não encontrado.');
    fila.fechar(true);
    await primeiro;
    assert.equal(atual.mensagem, 'Não foi possível salvar o cliente.');
    fila.fechar(true);
    await segundo;
    assert.equal(atual, null);
    fila.fechar();
});
