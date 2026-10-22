import io
import json as _json
import re

from flask import Blueprint, g, jsonify, request, send_file
from mysql.connector import Error as MySQLError

from auth.decorators import admin_required, login_required
from database.connection import db_cursor, open_connection

# Locais permitidos por tipo de produto (label exato enviado pelo frontend)
LOCAIS_VALIDOS_POR_PRODUTO = {
    "Camiseta": {
        "Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
        "Costas — Centro Alto", "Costas — Centro Baixo",
        "Manga Esquerda", "Manga Direita", "Gola",
    },
    "Camisa": {
        "Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
        "Costas — Centro Alto", "Costas — Centro Baixo",
        "Manga Esquerda", "Manga Direita", "Gola", "Bolso",
    },
    "Camisa Longa": {
        "Frente — Centro", "Costas — Centro Alto", "Gola",
        "Manga Esquerda", "Manga Direita", "Ambas as Mangas",
    },
    "Moletom c/ Capuz": {
        "Frente — Centro", "Costas — Centro Alto",
        "Manga Esquerda", "Manga Direita", "Capuz", "Bolso",
    },
    "Calça": {"Barra"},
}

pedidos_bp = Blueprint('pedidos', __name__)


# ---------- utilitários ----------

def _validar_telefone(tel):
    if not tel:
        return True
    nums = re.sub(r'\D', '', tel)
    return 10 <= len(nums) <= 11


def _resolver_catalogo(cursor, tipo, nome):
    """Retorna o id do item, criando-o automaticamente se ainda não existir."""
    if not nome or not str(nome).strip():
        return None
    nome = str(nome).strip()
    cursor.execute(
        "SELECT id FROM catalogo_itens WHERE tipo = %s AND nome = %s",
        (tipo, nome)
    )
    row = cursor.fetchone()
    if row:
        return row['id']
    cursor.execute(
        "INSERT INTO catalogo_itens (tipo, nome) VALUES (%s, %s)",
        (tipo, nome)
    )
    return cursor.lastrowid


# ---------- arte de item (MEDIUMBLOB) ----------

@pedidos_bp.route('/pedidos/itens/<int:item_id>/arte', methods=['GET'])
@login_required
def servir_item_arte(item_id):
    with db_cursor() as cursor:
        cursor.execute(
            "SELECT imagem_dados, imagem_mime FROM pedido_itens WHERE id = %s",
            (item_id,)
        )
        item = cursor.fetchone()
    if not item or not item.get('imagem_dados'):
        return jsonify(success=False, msg='Imagem não encontrada.'), 404
    buf = io.BytesIO(bytes(item['imagem_dados']))
    return send_file(buf, mimetype=item.get('imagem_mime') or 'image/png')


# ---------- QR Code do pedido ----------

@pedidos_bp.route('/pedidos/<int:pedido_id>/qrcode', methods=['GET'])
@login_required
def qrcode_pedido(pedido_id):
    with db_cursor() as cursor:
        cursor.execute(
            "SELECT id FROM pedidos WHERE id = %s AND excluido_em IS NULL",
            (pedido_id,)
        )
        if not cursor.fetchone():
            return jsonify(success=False, msg='Pedido não encontrado.'), 404
    from gerador_qrcode import gerar_qrcode_pedido
    buf = gerar_qrcode_pedido(pedido_id)
    return send_file(buf, mimetype='image/png')


# ---------- listar pedidos ----------

@pedidos_bp.route('/pedidos', methods=['GET'])
@login_required
def listar_pedidos():
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT
                p.id,
                p.numero_pedido,
                p.status,
                p.prioridade,
                p.data_pedido,
                p.prazo_entrega,
                p.obs_geral,
                p.created_at,
                c.nome      AS nome_cliente,
                c.telefone  AS contato,
                c.email,
                co.nome     AS nome_colaborador
            FROM pedidos p
            JOIN clientes c       ON c.id  = p.cliente_id
            JOIN colaboradores co ON co.id = p.colaborador_id
            WHERE p.excluido_em IS NULL
            ORDER BY p.created_at DESC
        """)
        pedidos = cursor.fetchall()

    for p in pedidos:
        if p.get('created_at'):
            p['created_at'] = p['created_at'].isoformat()
        if p.get('data_pedido'):
            p['data_pedido'] = str(p['data_pedido'])
        if p.get('prazo_entrega'):
            p['prazo_entrega'] = str(p['prazo_entrega'])

    return jsonify(success=True, data=pedidos)


# ---------- buscar pedido (completo, com itens) ----------

@pedidos_bp.route('/pedidos/<int:pedido_id>', methods=['GET'])
@login_required
def buscar_pedido(pedido_id):
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT
                p.id,
                p.numero_pedido,
                p.status,
                p.prioridade,
                p.data_pedido,
                p.prazo_entrega,
                p.obs_geral,
                p.created_at,
                p.data_conclusao,
                c.nome      AS nome_cliente,
                c.telefone  AS contato,
                c.email,
                co.nome     AS nome_colaborador
            FROM pedidos p
            JOIN clientes c       ON c.id  = p.cliente_id
            JOIN colaboradores co ON co.id = p.colaborador_id
            WHERE p.id = %s AND p.excluido_em IS NULL
        """, (pedido_id,))
        pedido = cursor.fetchone()

        if not pedido:
            return jsonify(success=False, msg='Pedido não encontrado.'), 404

        cursor.execute("""
            SELECT
                pi.id,
                pi.observacao,
                pi.imagem_url,
                (pi.imagem_dados IS NOT NULL) AS tem_imagem,
                cp.nome  AS tipo_produto,
                cpe.nome AS personalizacao,
                ct.nome  AS tecido,
                cc.nome  AS cor,
                cl.nome  AS local_arte
            FROM pedido_itens pi
            JOIN  catalogo_itens cp  ON cp.id  = pi.tipo_produto_id
            LEFT JOIN catalogo_itens cpe ON cpe.id = pi.personalizacao_id
            LEFT JOIN catalogo_itens ct  ON ct.id  = pi.tecido_id
            LEFT JOIN catalogo_itens cc  ON cc.id  = pi.cor_id
            LEFT JOIN catalogo_itens cl  ON cl.id  = pi.local_arte_id
            WHERE pi.pedido_id = %s
        """, (pedido_id,))
        itens = cursor.fetchall()

        for item in itens:
            cursor.execute(
                "SELECT tamanho, quantidade FROM pedido_item_tamanhos WHERE pedido_item_id = %s",
                (item['id'],)
            )
            item['tamanhos'] = cursor.fetchall()
            # URL de arte: MEDIUMBLOB tem prioridade sobre imagem_url legado
            if item.get('tem_imagem'):
                item['imagem_url'] = f'/api/pedidos/itens/{item["id"]}/arte'
            del item['tem_imagem']

        pedido['itens'] = itens

    for key in ('created_at', 'data_conclusao'):
        if pedido.get(key):
            pedido[key] = pedido[key].isoformat()
    for key in ('data_pedido', 'prazo_entrega'):
        if pedido.get(key):
            pedido[key] = str(pedido[key])

    return jsonify(success=True, data=pedido)


# ---------- criar pedido ----------

@pedidos_bp.route('/pedidos', methods=['POST'])
@login_required
def criar_pedido():
    # Suporta FormData (novo fluxo, com artes) e JSON (legado)
    dados_raw = request.form.get('dados')
    if dados_raw is not None:
        try:
            dados = _json.loads(dados_raw)
        except (ValueError, TypeError):
            return jsonify(success=False, msg='Dados inválidos.'), 400
    else:
        dados = request.get_json(silent=True) or {}

    nome_cliente  = (dados.get('nome_cliente') or '').strip()
    email_cliente = (dados.get('email_cliente') or '').strip() or None
    data_pedido   = (dados.get('data_pedido') or '').strip()
    prazo_entrega = dados.get('prazo_entrega') or None
    prioridade    = (dados.get('prioridade') or '').strip()
    obs_geral     = dados.get('obs_geral') or None
    produtos      = dados.get('produtos', [])
    contato       = (dados.get('contato') or '').strip() or None

    if not nome_cliente:
        return jsonify(success=False, msg='Nome do cliente é obrigatório.'), 400
    if not data_pedido:
        return jsonify(success=False, msg='Data do pedido é obrigatória.'), 400
    if prioridade not in ('baixa', 'media', 'alta'):
        return jsonify(success=False, msg='Prioridade inválida.'), 400
    if not produtos:
        return jsonify(success=False, msg='Selecione pelo menos um produto.'), 400
    if contato and not _validar_telefone(contato):
        return jsonify(success=False, msg='Telefone inválido. Use o formato (11) 99999-9999.'), 400

    colaborador_id = g.colaborador['id']

    conn = open_connection()
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)

        # find-or-create cliente:
        # Busca por nome exato (case-insensitive). Se houver mais de um,
        # tenta desambiguar por e-mail. Ambiguidade restante → cria novo.
        cursor.execute(
            "SELECT id FROM clientes WHERE LOWER(TRIM(nome)) = LOWER(TRIM(%s)) AND ativo = 1",
            (nome_cliente,)
        )
        correspondencias = cursor.fetchall()

        if len(correspondencias) == 1:
            cliente_id = correspondencias[0]['id']
        elif len(correspondencias) > 1 and email_cliente:
            cursor.execute(
                "SELECT id FROM clientes "
                "WHERE LOWER(TRIM(nome)) = LOWER(TRIM(%s)) AND email = %s AND ativo = 1",
                (nome_cliente, email_cliente)
            )
            unico = cursor.fetchone()
            cliente_id = unico['id'] if unico else None
        else:
            cliente_id = None

        if cliente_id is None:
            cursor.execute(
                "INSERT INTO clientes (nome, telefone, email) VALUES (%s, %s, %s)",
                (nome_cliente, contato, email_cliente)
            )
            cliente_id = cursor.lastrowid

        # Insere pedido com numero_pedido = NULL; atualiza após obter o id
        cursor.execute("""
            INSERT INTO pedidos
                (numero_pedido, cliente_id, colaborador_id,
                 data_pedido, prazo_entrega, prioridade, obs_geral, status)
            VALUES (NULL, %s, %s, %s, %s, %s, %s, 'pendente')
        """, (cliente_id, colaborador_id, data_pedido, prazo_entrega, prioridade, obs_geral))
        pedido_id = cursor.lastrowid

        cursor.execute(
            "UPDATE pedidos SET numero_pedido = %s WHERE id = %s",
            (pedido_id, pedido_id)
        )

        for i, prod in enumerate(produtos):
            item_nome = prod.get('item', '').strip()
            if not item_nome:
                continue
            detalhes = prod.get('detalhes', {})
            grade    = prod.get('grade', {})

            tipo_produto_id   = _resolver_catalogo(cursor, 'produto', item_nome)
            personalizacao_id = _resolver_catalogo(cursor, 'personalizacao', detalhes.get('personalizacao'))
            tecido_id         = _resolver_catalogo(cursor, 'tecido', detalhes.get('tecido'))
            cor_id            = _resolver_catalogo(cursor, 'cor', detalhes.get('cor'))
            local_id          = _resolver_catalogo(cursor, 'local', detalhes.get('local'))

            if not tecido_id or not cor_id or not local_id:
                cursor.close()
                conn.rollback()
                return jsonify(
                    success=False,
                    msg=f'Preencha Tecido, Cor e Local da Arte para o item "{item_nome}".'
                ), 400

            local_nome = (detalhes.get('local') or '').strip()
            locais_validos = LOCAIS_VALIDOS_POR_PRODUTO.get(item_nome)
            if locais_validos and local_nome and local_nome not in locais_validos:
                cursor.close()
                conn.rollback()
                return jsonify(
                    success=False,
                    msg=f'Local "{local_nome}" não é válido para "{item_nome}".'
                ), 400

            arquivo_arte = request.files.get(f'arte_{i}')
            imagem_dados = arquivo_arte.read() if arquivo_arte else None
            imagem_mime  = ((arquivo_arte.content_type or '').strip() or None) if arquivo_arte else None

            cursor.execute("""
                INSERT INTO pedido_itens
                    (pedido_id, tipo_produto_id, personalizacao_id,
                     tecido_id, cor_id, local_arte_id, observacao,
                     imagem_mime, imagem_dados)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                pedido_id, tipo_produto_id, personalizacao_id,
                tecido_id, cor_id, local_id,
                detalhes.get('observacao') or None,
                imagem_mime, imagem_dados,
            ))
            item_id = cursor.lastrowid

            for tamanho, quantidade in grade.items():
                try:
                    qtd = int(quantidade)
                except (TypeError, ValueError):
                    qtd = 0
                if qtd > 0:
                    cursor.execute(
                        "INSERT INTO pedido_item_tamanhos (pedido_item_id, tamanho, quantidade) "
                        "VALUES (%s, %s, %s)",
                        (item_id, tamanho, qtd)
                    )

        conn.commit()
        cursor.close()
        return jsonify(success=True, data={'id': pedido_id, 'numero_pedido': pedido_id}), 201

    except MySQLError:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------- atualizar status ----------

@pedidos_bp.route('/pedidos/<int:pedido_id>/status', methods=['PATCH'])
@login_required
def atualizar_status(pedido_id):
    dados = request.get_json(silent=True) or {}
    status_front = (dados.get('status') or '').strip()

    mapa = {'producao': 'em_producao', 'finalizado': 'concluido'}
    novo_status = mapa.get(status_front)
    if not novo_status:
        return jsonify(success=False, msg='Status inválido.'), 400

    transicoes_validas = {'pendente': 'em_producao', 'em_producao': 'concluido'}

    with db_cursor(commit=True) as cursor:
        cursor.execute(
            "SELECT status FROM pedidos WHERE id = %s AND excluido_em IS NULL",
            (pedido_id,)
        )
        pedido = cursor.fetchone()
        if not pedido:
            return jsonify(success=False, msg='Pedido não encontrado.'), 404

        if transicoes_validas.get(pedido['status']) != novo_status:
            return jsonify(success=False, msg='Transição de status não permitida.'), 400

        if novo_status == 'concluido':
            cursor.execute(
                "UPDATE pedidos SET status = %s, data_conclusao = NOW() WHERE id = %s",
                (novo_status, pedido_id)
            )
        else:
            cursor.execute(
                "UPDATE pedidos SET status = %s WHERE id = %s",
                (novo_status, pedido_id)
            )

    return jsonify(success=True)


# ---------- atualizar pedido (via solicitação aprovada) ----------

@pedidos_bp.route('/pedidos/<int:pedido_id>', methods=['PUT'])
@login_required
def atualizar_pedido(pedido_id):
    dados = request.get_json(silent=True) or {}

    with db_cursor(commit=True) as cursor:
        cursor.execute(
            "SELECT id FROM pedidos WHERE id = %s AND excluido_em IS NULL",
            (pedido_id,)
        )
        if not cursor.fetchone():
            return jsonify(success=False, msg='Pedido não encontrado.'), 404

        campos = {}
        if 'prazo_entrega' in dados:
            campos['prazo_entrega'] = dados['prazo_entrega'] or None
        if 'prioridade' in dados and dados['prioridade'] in ('baixa', 'media', 'alta'):
            campos['prioridade'] = dados['prioridade']
        if 'obs_geral' in dados:
            campos['obs_geral'] = dados['obs_geral'] or None

        if campos:
            sets = ', '.join(f"{k} = %s" for k in campos)
            cursor.execute(
                f"UPDATE pedidos SET {sets} WHERE id = %s",
                [*campos.values(), pedido_id]
            )

    return jsonify(success=True)


# ---------- excluir pedido (lógico, somente admin) ----------

@pedidos_bp.route('/pedidos/<int:pedido_id>', methods=['DELETE'])
@admin_required
def excluir_pedido(pedido_id):
    with db_cursor(commit=True) as cursor:
        cursor.execute(
            "UPDATE pedidos SET excluido_em = NOW() WHERE id = %s AND excluido_em IS NULL",
            (pedido_id,)
        )
        if cursor.rowcount == 0:
            return jsonify(success=False, msg='Pedido não encontrado.'), 404

    return jsonify(success=True)
