import json

from flask import Blueprint, g, jsonify, request
from mysql.connector import Error as MySQLError

from auth.decorators import admin_required, login_required
from database.connection import db_cursor, open_connection

solicitacoes_bp = Blueprint('solicitacoes', __name__)


@solicitacoes_bp.route('/solicitacoes', methods=['GET'])
@login_required
def listar_solicitacoes():
    colaborador = g.colaborador
    with db_cursor() as cursor:
        if colaborador['nivel_acesso'] == 'administrador':
            cursor.execute("""
                SELECT
                    s.id,
                    s.tipo,
                    s.pedido_id,
                    s.status,
                    s.dados_propostos,
                    s.data_solicitacao,
                    s.data_decisao,
                    co.nome AS nome_solicitante
                FROM solicitacoes s
                JOIN colaboradores co ON co.id = s.colaborador_solicitante_id
                WHERE s.pedido_id IS NOT NULL
                ORDER BY s.data_solicitacao DESC
            """)
        else:
            cursor.execute("""
                SELECT
                    s.id,
                    s.tipo,
                    s.pedido_id,
                    s.status,
                    s.dados_propostos,
                    s.data_solicitacao,
                    s.data_decisao,
                    co.nome AS nome_solicitante
                FROM solicitacoes s
                JOIN colaboradores co ON co.id = s.colaborador_solicitante_id
                WHERE s.pedido_id IS NOT NULL
                  AND s.colaborador_solicitante_id = %s
                ORDER BY s.data_solicitacao DESC
            """, (colaborador['id'],))

        rows = cursor.fetchall()

    resultado = []
    for r in rows:
        dp = r.get('dados_propostos') or {}
        if isinstance(dp, str):
            try:
                dp = json.loads(dp)
            except (ValueError, TypeError):
                dp = {}

        resultado.append({
            'id': r['id'],
            'tipo': r['tipo'],
            'pedidoId': r['pedido_id'],
            'status': r['status'],
            'resumo': dp.get('resumo', ''),
            'justificativa': dp.get('justificativa', ''),
            'motivo': dp.get('motivo_recusa', ''),
            'solicitante': r['nome_solicitante'],
            'criadoEm': r['data_solicitacao'].isoformat() if r['data_solicitacao'] else None,
            'decididoEm': r['data_decisao'].isoformat() if r['data_decisao'] else None,
            'alteracoes': dp.get('alteracoes', []),
            'pedidoNovo': dp.get('pedidoNovo'),
        })

    return jsonify(success=True, data=resultado)


@solicitacoes_bp.route('/solicitacoes', methods=['POST'])
@login_required
def criar_solicitacao():
    dados = request.get_json(silent=True) or {}

    tipo = dados.get('tipo', 'edicao')
    pedido_id = dados.get('pedido_id') or dados.get('pedidoId')
    resumo = dados.get('resumo', '')
    justificativa = (dados.get('justificativa') or '').strip()
    alteracoes = dados.get('alteracoes', [])
    pedido_novo = dados.get('pedidoNovo')

    if tipo not in ('edicao', 'exclusao'):
        return jsonify(success=False, msg='Tipo de solicitação inválido.'), 400
    if not pedido_id:
        return jsonify(success=False, msg='ID do pedido é obrigatório.'), 400
    if tipo == 'exclusao' and len(justificativa) < 5:
        return jsonify(success=False, msg='Explique o motivo da exclusão com mais detalhes.'), 400

    colaborador_id = g.colaborador['id']

    with db_cursor(commit=True) as cursor:
        # Verifica se já existe solicitação pendente para este pedido
        cursor.execute("""
            SELECT id FROM solicitacoes
            WHERE pedido_id = %s AND status = 'pendente'
        """, (pedido_id,))
        if cursor.fetchone():
            return jsonify(success=False, msg='Já existe uma solicitação pendente para este pedido.'), 409

        # Verifica se o pedido existe
        cursor.execute(
            "SELECT id FROM pedidos WHERE id = %s AND excluido_em IS NULL",
            (pedido_id,)
        )
        if not cursor.fetchone():
            return jsonify(success=False, msg='Pedido não encontrado.'), 404

        dados_propostos = {
            'resumo': resumo,
            'justificativa': justificativa,
            'alteracoes': alteracoes,
            'pedidoNovo': pedido_novo,
        }

        cursor.execute("""
            INSERT INTO solicitacoes
                (tipo, pedido_id, colaborador_solicitante_id, dados_propostos, status)
            VALUES (%s, %s, %s, %s, 'pendente')
        """, (tipo, pedido_id, colaborador_id, json.dumps(dados_propostos, ensure_ascii=False)))
        nova_id = cursor.lastrowid

    return jsonify(success=True, data={'id': nova_id}), 201


@solicitacoes_bp.route('/solicitacoes/<int:sol_id>/decisao', methods=['PATCH'])
@admin_required
def decidir_solicitacao(sol_id):
    dados = request.get_json(silent=True) or {}
    decisao = dados.get('decisao', '')
    motivo = (dados.get('motivo') or '').strip()

    if decisao not in ('aprovada', 'recusada'):
        return jsonify(success=False, msg='Decisão inválida.'), 400

    conn = open_connection()
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)

        cursor.execute("""
            SELECT id, tipo, pedido_id, status, dados_propostos
            FROM solicitacoes WHERE id = %s
        """, (sol_id,))
        sol = cursor.fetchone()

        if not sol:
            cursor.close()
            conn.rollback()
            return jsonify(success=False, msg='Solicitação não encontrada.'), 404
        if sol['status'] != 'pendente':
            cursor.close()
            conn.rollback()
            return jsonify(success=False, msg='Esta solicitação já foi respondida.'), 409

        dp = sol.get('dados_propostos') or {}
        if isinstance(dp, str):
            try:
                dp = json.loads(dp)
            except (ValueError, TypeError):
                dp = {}

        if decisao == 'aprovada':
            if sol['tipo'] == 'exclusao':
                cursor.execute(
                    "UPDATE pedidos SET excluido_em = NOW() WHERE id = %s AND excluido_em IS NULL",
                    (sol['pedido_id'],)
                )
            else:
                # Aplica alterações do pedido
                pedido_novo = dp.get('pedidoNovo') or {}
                ficha_nova = pedido_novo.get('ficha', {}) if isinstance(pedido_novo, dict) else {}

                campos = {}
                if 'entrega' in ficha_nova and ficha_nova['entrega']:
                    campos['prazo_entrega'] = ficha_nova['entrega']
                if 'prioridade' in ficha_nova and ficha_nova['prioridade'] in ('baixa', 'media', 'alta'):
                    campos['prioridade'] = ficha_nova['prioridade']
                if 'observacao' in ficha_nova:
                    campos['obs_geral'] = ficha_nova['observacao'] or None

                if campos:
                    sets = ', '.join(f"{k} = %s" for k in campos)
                    cursor.execute(
                        f"UPDATE pedidos SET {sets} WHERE id = %s",
                        [*campos.values(), sol['pedido_id']]
                    )

        # Atualiza dados_propostos com motivo de recusa, se houver
        if decisao == 'recusada' and motivo:
            dp['motivo_recusa'] = motivo
            cursor.execute(
                "UPDATE solicitacoes SET dados_propostos = %s WHERE id = %s",
                (json.dumps(dp, ensure_ascii=False), sol_id)
            )

        cursor.execute("""
            UPDATE solicitacoes
            SET status = %s, administrador_id = %s, data_decisao = NOW()
            WHERE id = %s
        """, (decisao, g.colaborador['id'], sol_id))

        conn.commit()
        cursor.close()
        return jsonify(success=True)

    except MySQLError:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@solicitacoes_bp.route('/solicitacoes/<int:sol_id>/visto', methods=['PATCH'])
@login_required
def marcar_como_vista(sol_id):
    # O controle de "visto" é mantido no frontend (localStorage).
    # Este endpoint existe para compatibilidade com o serviço migrado.
    return jsonify(success=True)
