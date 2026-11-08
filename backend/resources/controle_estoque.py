"""Regra compartilhada de saldo em peças (alias SQL de estoque: e)."""

# Unidade preenchida conserva a regra legada. Sem unidade, somente produtos
# sem variações são controlados por peças; materiais continuam fora da baixa.
FILTRO_ESTOQUE_PECAS = """(
    e.unidade_medida = 'Unidade'
    OR (
        (e.unidade_medida IS NULL OR e.unidade_medida = '')
        AND e.tipo_item = 'produto'
        AND e.tem_variacoes = 0
    )
)"""
