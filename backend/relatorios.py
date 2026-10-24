"""T11: estatísticas consultadas no banco, sem persistência própria."""

from datetime import date

from flask import Blueprint, jsonify

from auth.decorators import admin_required
from database.connection import db_cursor


relatorios_bp = Blueprint('relatorios', __name__)


def periodo_atual():
    hoje = date.today()
    inicio = hoje.replace(day=1)
    fim = date(hoje.year + 1, 1, 1) if hoje.month == 12 else date(hoje.year, hoje.month + 1, 1)
    return inicio, fim


@relatorios_bp.get('/relatorios/resumo')
@admin_required
def resumo():
    inicio, fim = periodo_atual()
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN status = 'pendente' THEN 1 END) AS pedidos_pendentes,
                COUNT(CASE WHEN status = 'em_producao' THEN 1 END) AS pedidos_em_producao,
                COUNT(CASE WHEN status = 'concluido' THEN 1 END) AS pedidos_concluidos_total,
                COUNT(CASE WHEN status = 'concluido' AND data_conclusao >= %s
                    AND data_conclusao < %s THEN 1 END) AS pedidos_concluidos
            FROM pedidos WHERE excluido_em IS NULL
        """, (inicio, fim))
        dados = dict(cursor.fetchone())
        cursor.execute("""
            SELECT COALESCE(SUM(t.quantidade), 0) AS producao_total
            FROM pedidos p
            JOIN pedido_itens i ON i.pedido_id = p.id
            JOIN pedido_item_tamanhos t ON t.pedido_item_id = i.id
            WHERE p.excluido_em IS NULL AND p.status = 'concluido'
                AND p.data_conclusao >= %s AND p.data_conclusao < %s
        """, (inicio, fim))
        dados['producao_total'] = int(cursor.fetchone()['producao_total'])
        cursor.execute("""
            SELECT COUNT(*) AS estoque_baixo FROM estoque
            WHERE ativo = 1 AND quantidade_atual <= estoque_minimo
        """)
        dados['estoque_baixo'] = cursor.fetchone()['estoque_baixo']
    return jsonify(success=True, data={**dados, 'ano': inicio.year, 'mes': inicio.month})


@relatorios_bp.get('/relatorios/producao-mensal')
@admin_required
def producao_mensal():
    inicio, _ = periodo_atual()
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT MONTH(p.data_conclusao) AS mes, SUM(t.quantidade) AS total
            FROM pedidos p
            JOIN pedido_itens i ON i.pedido_id = p.id
            JOIN pedido_item_tamanhos t ON t.pedido_item_id = i.id
            WHERE p.excluido_em IS NULL AND p.status = 'concluido'
                AND p.data_conclusao >= %s AND p.data_conclusao < %s
            GROUP BY MONTH(p.data_conclusao) ORDER BY mes
        """, (date(inicio.year, 1, 1), date(inicio.year + 1, 1, 1)))
        totais = {linha['mes']: int(linha['total']) for linha in cursor.fetchall()}
    return jsonify(success=True, data={
        'ano': inicio.year,
        'meses': [{'mes': mes, 'total': totais.get(mes, 0)} for mes in range(1, 13)],
    })
