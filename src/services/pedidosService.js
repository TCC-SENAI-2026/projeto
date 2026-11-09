import { api } from './api.js';

// Tradução de status entre frontend e banco
const STATUS_PARA_FRONT = {
    pendente:    'pendente',
    em_producao: 'producao',
    concluido:   'finalizado',
    cancelado:   'cancelado',
};

const STATUS_PARA_API = {
    pendente:   'pendente',
    producao:   'em_producao',
    finalizado: 'concluido',
};

const statusParaFront = (s) => STATUS_PARA_FRONT[s] ?? s;
const statusParaApi   = (s) => STATUS_PARA_API[s]   ?? s;

function urlLogoCliente(logo) {
    if (!logo || typeof logo !== 'string') return null;
    if (/^https?:\/\//i.test(logo) || logo.startsWith('/api/')) return logo;
    if (logo.startsWith('/static/')) return `/api${logo}`;
    if (logo.startsWith('/')) return logo;
    return `/api/static/uploads/${encodeURIComponent(logo)}`;
}

// Converte a resposta da API para o formato esperado pelas telas
function apiParaFront(p) {
    return {
        id:                p.id,
        numero_pedido:     p.numero_pedido,
        status:            statusParaFront(p.status),
        prioridade:        p.prioridade,
        nome_colaborador:  p.nome_colaborador,
        imagemUrl:         p.imagem_pedido_url || urlLogoCliente(p.logo_cliente),
        // Estrutura compatível com FichaModal, FichaConteudo e Pedidos.jsx
        ficha: {
            numero_pedido: p.numero_pedido,
            colaborador:   p.nome_colaborador,
            cliente:       p.nome_cliente,
            logoCliente:   urlLogoCliente(p.logo_cliente),
            contato:       p.contato,
            email:         p.email,
            dataPedido:    p.data_pedido,
            entrega:       p.prazo_entrega,
            prioridade:    p.prioridade,
            observacao:    p.obs_geral,
        },
        pedido: p.itens ? {
            arte: null,
            produtos: (p.itens || []).map(item => ({
                item: item.tipo_produto,
                estoque_id: item.estoque_id || null,
                grade: Object.fromEntries(
                    (item.tamanhos || []).map(t => [t.tamanho, t.quantidade])
                ),
                detalhes: {
                    id:             item.id,
                    tipo_produto_id: item.tipo_produto_id ?? null,
                    material_id: item.material_id ?? null,
                    material_cor_id: item.material_cor_id ?? null,
                    tecido_id: item.tecido_id ?? null,
                    cor_id: item.cor_id ?? null,
                    estoque_id:     item.estoque_id || null,
                    personalizacao: item.personalizacao,
                    tecido:         item.tecido,
                    cor:            item.cor,
                    local:          item.local_arte,
                    observacao:     item.observacao,
                    imagem_url:     item.imagem_url,
                },
            })),
        } : undefined,
    };
}

export async function listarPedidos() {
    const res = await api.get('/pedidos');
    return (res.data || []).map(apiParaFront);
}

export async function buscarPedido(id) {
    const res = await api.get(`/pedidos/${id}`);
    const pedido = apiParaFront(res.data);
    const produtos = pedido.pedido?.produtos || [];

    if (!pedido.ficha.logoCliente && produtos.some(produto => !produto.detalhes.imagem_url)) {
        const clientes = await api.get('/listar-clientes', { lista: true });
        const nomeCliente = String(pedido.ficha.cliente || '').trim().toLocaleLowerCase('pt-BR');
        const emailCliente = String(pedido.ficha.email || '').trim().toLocaleLowerCase('pt-BR');
        const correspondencias = clientes.filter(cliente =>
            String(cliente[0] || '').trim().toLocaleLowerCase('pt-BR') === nomeCliente
        );
        const cliente = correspondencias.find(item =>
            emailCliente && String(item[4] || '').trim().toLocaleLowerCase('pt-BR') === emailCliente
        ) || correspondencias[0];

        pedido.ficha.logoCliente = urlLogoCliente(cliente?.[11]);
    }

    if (pedido.ficha.logoCliente) {
        produtos.forEach(produto => {
            if (!produto.detalhes.imagem_url) {
                produto.detalhes.imagem_url = pedido.ficha.logoCliente;
            }
        });
    }

    return pedido;
}

export async function salvarPedido({ pedido, ficha, artesOrdenadas = [] }) {
    const payload = {
        nome_cliente:  ficha.cliente,
        email_cliente: ficha.email  || null,
        data_pedido:   ficha.dataPedido,
        prazo_entrega: ficha.entrega || null,
        prioridade:    ficha.prioridade,
        obs_geral:     ficha.observacao || null,
        contato:       ficha.contato || null,
        produtos: (pedido.produtos || []).map(p => ({
            item:       p.item,
            grade:      p.grade,
            estoque_id: p.estoque_id ?? p.detalhes?.estoque_id ?? null,
            detalhes: {
                material_id: p.detalhes?.material_id ?? null,
                material_cor_id: p.detalhes?.material_cor_id ?? null,
                tecido:         p.detalhes?.tecido,
                cor:            p.detalhes?.cor,
                personalizacao: p.detalhes?.personalizacao,
                local:          p.detalhes?.local,
            },
        })),
    };

    const formData = new FormData();
    formData.append('dados', JSON.stringify(payload));
    artesOrdenadas.forEach((arte, i) => {
        if (arte instanceof File) formData.append(`arte_${i}`, arte);
        else if (arte?.logoCliente) formData.append(`logo_cliente_${i}`, arte.logoCliente);
    });

    const res = await api.postFile('/pedidos', formData);
    return res.data;
}

export async function excluirPedido(id) {
    await api.delete(`/pedidos/${id}`);
}

export async function atualizarPedido(id, pedidoNovo) {
    const payload = { ...pedidoNovo };
    if (Array.isArray(pedidoNovo.pedido?.produtos)) {
        payload.pedido = { ...pedidoNovo.pedido, produtos: pedidoNovo.pedido.produtos.map(produto => {
            const detalhes = { ...produto.detalhes };
            delete detalhes.observacao;
            return { ...produto, detalhes };
        }) };
    }
    await api.put(`/pedidos/${id}`, payload);
}

export async function atualizarStatus(id, novoStatusFront) {
    await api.patch(`/pedidos/${id}/status`, { status: novoStatusFront });
}

// Só estas transições são permitidas (validação também no backend)
export const TRANSICOES = {
    pendente:   ['producao'],
    producao:   ['finalizado'],
};
