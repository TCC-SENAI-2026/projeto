import { api } from './api.js';

// IDs das solicitações que o usuário já fechou (visto no banner).
// Guardados no localStorage por ser uma preferência visual do navegador.
const CHAVE_VISTAS = 'solicitacoes_vistas';

function lerVistas() {
    try {
        return new Set(JSON.parse(localStorage.getItem(CHAVE_VISTAS) || '[]'));
    } catch {
        return new Set();
    }
}

function salvarVistas(conjunto) {
    try {
        localStorage.setItem(CHAVE_VISTAS, JSON.stringify([...conjunto]));
    } catch {
        // ignora falha de armazenamento
    }
}

export async function listarSolicitacoes() {
    const res = await api.get('/solicitacoes');
    const vistas = lerVistas();
    return (res.data || []).map(s => ({
        ...s,
        visto: vistas.has(String(s.id)),
    }));
}

export async function criarSolicitacao({
    tipo = 'edicao',
    pedidoId,
    resumo = '',
    justificativa = '',
    alteracoes = [],
    pedidoNovo = null,
}) {
    const payload = {
        tipo,
        pedido_id:    pedidoId,
        resumo,
        justificativa,
        alteracoes,
        pedidoNovo,
    };
    const res = await api.post('/solicitacoes', payload);
    return res.data;
}

export async function decidirSolicitacao(id, decisao, motivo = '') {
    await api.patch(`/solicitacoes/${id}/decisao`, { decisao, motivo });
}

export async function marcarComoVista(id) {
    // Persiste localmente; o backend tem um endpoint de compatibilidade que ignora a chamada.
    const vistas = lerVistas();
    vistas.add(String(id));
    salvarVistas(vistas);
    try {
        await api.patch(`/solicitacoes/${id}/visto`, {});
    } catch {
        // falha silenciosa — o estado local já foi salvo
    }
}
