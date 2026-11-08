import { LOCAIS, LOCAIS_POR_PRODUTO, MODELOS } from './opcoesProduto.js';

export function avisoSaldo(produto) {
    if (Number(produto.quantidade_atual) <= 0) return ' (sem estoque)';
    return Number(produto.quantidade_atual) <= Number(produto.estoque_minimo)
        ? ' (estoque baixo)' : '';
}

export function locaisProdutoPedido(produto) {
    if (!produto.detalhes?.tipo_produto_id) return LOCAIS;
    const modelo = MODELOS.find(m => m.label === produto.item);
    const permitidos = LOCAIS_POR_PRODUTO[modelo?.id];
    if (!permitidos) return LOCAIS;
    return LOCAIS.map(grupo => ({ ...grupo,
        options: grupo.options.filter(local => permitidos.includes(local)),
    })).filter(grupo => grupo.options.length);
}
