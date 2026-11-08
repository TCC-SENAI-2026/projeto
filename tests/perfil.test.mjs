import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api } from '../src/services/api.js';
import { buscarPerfil, salvarPerfil } from '../src/services/perfilService.js';

test('perfil envia somente campos permitidos, preservando dados bloqueados apenas na leitura', async t => {
    let enviado;
    t.mock.method(api, 'put', async (url, payload) => { enviado = { url, payload }; return { modo: 'solicitacao' }; });
    const dados = { nome: 'Pessoa', email: 'pessoa@example.invalid', telefone: '11999999999', endereco: 'Rua A',
        re: '0002', cpf: '123', salario: 100, ativo: true, nivel_acesso: 'administrador', senha: 'nao-enviar' };
    const resultado = await salvarPerfil(dados, null);
    assert.equal(resultado.modo, 'solicitacao');
    assert.equal(enviado.url, '/perfil');
    assert.deepEqual(Object.keys(enviado.payload).sort(), ['email', 'endereco', 'nome', 'telefone']);
    assert.equal(dados.cpf, '123');
    await salvarPerfil(dados, null, true);
    assert.equal(enviado.payload.foto, null);
});

test('foto comprimida é enviada em base64 e arquivo acima de 1 MB é barrado', async t => {
    let enviado;
    t.mock.method(api, 'put', async (_, payload) => { enviado = payload; return { modo: 'direto' }; });
    const anterior = globalThis.FileReader;
    globalThis.FileReader = class {
        readAsDataURL() { this.result = 'data:image/jpeg;base64,Y29tcHJpbWlkYQ=='; this.onload(); }
    };
    t.after(() => { if (anterior === undefined) delete globalThis.FileReader; else globalThis.FileReader = anterior; });
    const resposta = await salvarPerfil({ nome: 'Admin', email: 'admin@example.invalid' }, new File(['comprimida'], 'foto.jpg', { type: 'image/jpeg' }));
    assert.equal(resposta.modo, 'direto');
    assert.equal(enviado.foto, 'data:image/jpeg;base64,Y29tcHJpbWlkYQ==');
    await assert.rejects(salvarPerfil({}, { size: 1024 * 1024 + 1 }), /1 MB/);
});

test('consulta devolve dados atuais e resultado ou pendência para o próprio Perfil', async t => {
    t.mock.method(api, 'get', async url => {
        assert.equal(url, '/perfil');
        return { data: { id: 2, nome: 'Atual' }, solicitacao: { status: 'pendente' } };
    });
    const resultado = await buscarPerfil();
    assert.equal(resultado.data.nome, 'Atual');
    assert.equal(resultado.solicitacao.status, 'pendente');
});
