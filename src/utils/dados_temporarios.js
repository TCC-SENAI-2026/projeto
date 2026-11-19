const CHAVES_DA_CONTA = ['dadosFicha', 'detalhesPedido'];
const CHAVES_RASCUNHO = ['identificacaoPedido', 'produtosRascunhoPedido'];
let artesRascunhoPedido = {};

export function lerRascunhoPedido(chave, padrao) {
    try {
        return JSON.parse(sessionStorage.getItem(chave)) ?? padrao;
    } catch {
        return padrao;
    }
}

export function guardarRascunhoPedido(chave, dados) {
    try { sessionStorage.setItem(chave, JSON.stringify(dados)); } catch { /* Armazenamento pode estar bloqueado. */ }
}

export function lerArtesRascunhoPedido() {
    return artesRascunhoPedido;
}

export function guardarArteRascunhoPedido(id, arte) {
    const anterior = artesRascunhoPedido[id];
    if (anterior?.preview) URL.revokeObjectURL(anterior.preview);
    artesRascunhoPedido = { ...artesRascunhoPedido, [id]: arte };
    return artesRascunhoPedido;
}

export function limparDadosTemporarios() {
    for (const chave of CHAVES_DA_CONTA) {
        try { localStorage.removeItem(chave); } catch { /* Armazenamento pode estar bloqueado. */ }
    }
    for (const chave of CHAVES_RASCUNHO) {
        try { sessionStorage.removeItem(chave); } catch { /* Armazenamento pode estar bloqueado. */ }
    }
    for (const arte of Object.values(artesRascunhoPedido)) {
        if (arte?.preview) URL.revokeObjectURL(arte.preview);
    }
    artesRascunhoPedido = {};
}
