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

// Converte a resposta da API para o formato esperado pelas telas
function apiParaFront(p) {
    return {
        id:                p.id,
        numero_pedido:     p.numero_pedido,
        status:            statusParaFront(p.status),
        prioridade:        p.prioridade,
        nome_colaborador:  p.nome_colaborador,
        // Estrutura compatível com FichaModal, FichaConteudo e Pedidos.jsx
        ficha: {
            numero_pedido: p.numero_pedido,
            colaborador:   p.nome_colaborador,
            cliente:       p.nome_cliente,
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
                grade: Object.fromEntries(
                    (item.tamanhos || []).map(t => [t.tamanho, t.quantidade])
                ),
                detalhes: {
                    id:             item.id,
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
    return apiParaFront(res.data);
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
            estoque_id: p.estoque_id || null,
            detalhes: {
                tecido:         p.detalhes?.tecido,
                cor:            p.detalhes?.cor,
                personalizacao: p.detalhes?.personalizacao,
                local:          p.detalhes?.local,
                observacao:     p.detalhes?.observacao,
            },
        })),
    };

    const formData = new FormData();
    formData.append('dados', JSON.stringify(payload));
    artesOrdenadas.forEach((file, i) => {
        if (file instanceof File) formData.append(`arte_${i}`, file);
    });

    const res = await api.postFile('/pedidos', formData);
    return res.data;
}

export async function excluirPedido(id) {
    await api.delete(`/pedidos/${id}`);
}

export async function atualizarPedido(id, pedidoNovo) {
    await api.put(`/pedidos/${id}`, pedidoNovo);
}

export async function atualizarStatus(id, novoStatusFront) {
    await api.patch(`/pedidos/${id}/status`, { status: novoStatusFront });
}

// Só estas transições são permitidas (validação também no backend)
export const TRANSICOES = {
    pendente:   ['producao'],
    producao:   ['finalizado'],
};
