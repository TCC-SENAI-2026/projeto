import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mascaraTelefone, mascaraCpf, mascaraCpfCnpj, mascaraCep, mascaraSalario } from '../src/utils/formatacao.js';

test('telefone segue Novo Pedido para celular e fixo, inclusive valores carregados', () => {
    assert.equal(mascaraTelefone('11987654321'), '(11) 98765-4321');
    assert.equal(mascaraTelefone('1134567890'), '(11) 3456-7890');
    assert.equal(mascaraTelefone('(11) 98765-4321'), '(11) 98765-4321');
    assert.equal(mascaraTelefone('1198765432199'), '(11) 98765-4321');
    assert.equal(mascaraTelefone('abc'), '');
});

test('CPF e CPF/CNPJ aplicam pontuação progressiva e aceitam colar documentos formatados', () => {
    assert.equal(mascaraCpf('12345678901'), '123.456.789-01');
    assert.equal(mascaraCpf('123.456.789-01'), '123.456.789-01');
    assert.equal(mascaraCpf('1234'), '123.4');
    assert.equal(mascaraCpfCnpj('12345678901'), '123.456.789-01');
    assert.equal(mascaraCpfCnpj('12345678000199'), '12.345.678/0001-99');
    assert.equal(mascaraCpfCnpj('12.345.678/0001-99'), '12.345.678/0001-99');
});

test('CEP limita a oito dígitos e preserva zeros à esquerda', () => {
    assert.equal(mascaraCep('01234567'), '01234-567');
    assert.equal(mascaraCep('01234-567'), '01234-567');
    assert.equal(mascaraCep('01234567890'), '01234-567');
});

test('salário usa centavos, separador de milhar e formato aceito no backend', () => {
    assert.equal(mascaraSalario('350000'), '3.500,00');
    assert.equal(mascaraSalario('3.500,00'), '3.500,00');
    assert.equal(mascaraSalario('1'), '0,01');
    assert.equal(mascaraSalario('0'), '0,00');
    assert.equal(mascaraSalario(''), '');
    assert.equal(mascaraSalario('R$ 12.345,67'), '12.345,67');
    const enviado = mascaraSalario('350000').replaceAll('.', '').replace(',', '.');
    assert.equal(enviado, '3500.00');
});

test('máscaras permitem limpar os campos opcionais', () => {
    for (const mascara of [mascaraTelefone, mascaraCpf, mascaraCpfCnpj, mascaraCep, mascaraSalario]) {
        assert.equal(mascara(''), '');
        assert.equal(mascara(null), '');
        assert.equal(mascara(undefined), '');
    }
});

test('CPF/CNPJ troca a máscara durante digitação e retorna a CPF ao apagar', () => {
    let texto = '';
    for (const digito of '12345678000199') texto = mascaraCpfCnpj(texto + digito);
    assert.equal(texto, '12.345.678/0001-99');
    for (let i = 0; i < 3; i++) texto = mascaraCpfCnpj(texto.slice(0, -1));
    assert.equal(texto, '123.456.780-00');
});
