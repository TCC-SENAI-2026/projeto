export function novaCorMaterial() {
    return { nome_cor: '', quantidade_atual: '', estoque_minimo: '' };
}

export function prepararCoresMaterial(cores) {
    const preenchidas = cores.filter(cor => cor.id != null ||
        [cor.nome_cor, cor.quantidade_atual, cor.estoque_minimo]
            .some(valor => valor != null && String(valor).trim() !== ''));
    if (!preenchidas.length) throw new Error('Informe ao menos uma cor com nome preenchido.');
    const nomes = new Set();
    return preenchidas.map(cor => {
        const nome = cor.nome_cor.trim();
        if (!nome || nome.length > 100) throw new Error('Informe o nome de cada cor (até 100 caracteres).');
        const chave = nome.toLocaleLowerCase('pt-BR');
        if (nomes.has(chave)) throw new Error('Não são permitidos nomes de cor repetidos no mesmo tecido.');
        nomes.add(chave);
        const resultado = { nome_cor: nome };
        if (cor.id != null) resultado.id = cor.id;
        for (const campo of ['quantidade_atual', 'estoque_minimo']) {
            const valor = String(cor[campo] ?? '').trim().replace(',', '.');
            const numero = Number(valor);
            if (!Number.isFinite(numero) || numero < 0 || numero > 99999999.99 ||
                !/^\d*(\.\d{0,2})?$/.test(valor)) {
                throw new Error('Metros e estoque mínimo devem ser positivos ou zero, com até duas casas decimais.');
            }
            resultado[campo] = valor || '0';
        }
        return resultado;
    });
}
