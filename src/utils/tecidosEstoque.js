export function nomeTecidoCor(detalhes = {}) {
    return [detalhes.tecido, detalhes.cor].filter(Boolean).join(' · ');
}

export function selecionarTecidoCor(tecidos, valor) {
    for (const tecido of tecidos) {
        const cor = (tecido.cores || []).find(c => String(c.id) === String(valor));
        if (cor && Number(cor.quantidade_atual) > 0) {
            return { material_id: tecido.id, material_cor_id: cor.id,
                tecido: tecido.nome_item, cor: cor.nome_cor };
        }
    }
    return { material_id: null, material_cor_id: null, tecido: '', cor: '' };
}
