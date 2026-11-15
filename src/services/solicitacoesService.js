import { api } from './api.js';

// IDs das solicitações que o usuário já fechou (visto no banner).
// Guardados no localStorage por ser uma preferência visual do navegador.
const CHAVE_VISTAS = 'solicitacoes_vistas';
const CHAVE_PRAZOS = 'solicitacoes_prazos_avisos';
export const DURACAO_AVISO = 6000;

function lerPrazos() {
    try {
        const valor = JSON.parse(localStorage.getItem(CHAVE_PRAZOS) || '{}');
        return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
    } catch {
        return {};
    }
}

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

export async function listarSolicitacoes({ notificar = false } = {}) {
    const res = await api.get('/solicitacoes');
    return prepararAvisos(res.data || [], { notificar });
}

export function prepararAvisos(solicitacoes, { notificar = false } = {}) {
    const vistas = lerVistas();
    const prazos = lerPrazos();
    const agora = Date.now();
    const dados = solicitacoes.map(s => {
        const chave = String(s.id);
        if (notificar && s.status !== 'pendente' && !vistas.has(chave) && !Number.isFinite(prazos[chave])) {
            prazos[chave] = agora + DURACAO_AVISO;
        }
        return {
            ...s,
            expiraEm: prazos[chave],
            visto: vistas.has(chave) || (Number.isFinite(prazos[chave]) && prazos[chave] <= agora),
        };
    });
    if (notificar) {
        try { localStorage.setItem(CHAVE_PRAZOS, JSON.stringify(prazos)); } catch { /* preferência local */ }
    }
    return dados;
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
