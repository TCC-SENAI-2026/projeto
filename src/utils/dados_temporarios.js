const CHAVES_DA_CONTA = ['dadosFicha', 'detalhesPedido'];

export function limparDadosTemporarios() {
    for (const chave of CHAVES_DA_CONTA) {
        try { localStorage.removeItem(chave); } catch { /* Armazenamento pode estar bloqueado. */ }
    }
}
