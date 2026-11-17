// Cada chamada aguarda o fechamento do seu modal, inclusive antes de navegar.
export function criarFilaAvisos(exibir) {
    const fila = [];
    return {
        abrir(mensagem, confirmacao = false) {
            return new Promise(resolve => {
                const aviso = { mensagem: String(mensagem ?? ''), confirmacao, resolve };
                fila.push(aviso);
                if (fila.length === 1) exibir(aviso);
            });
        },
        fechar(confirmado = false) {
            const aviso = fila.shift();
            if (!aviso) return;
            exibir(fila[0] || null);
            aviso.resolve(confirmado);
        },
    };
}
