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
        "Costas — Centro Alto", "Costas — Centro Baixo", "Costas — Full Back",
        "Manga Esquerda", "Manga Direita", "Gola",
    },
    "Camisa": {
        "Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
        "Costas — Centro Alto", "Costas — Centro Baixo", "Costas — Full Back",
        "Manga Esquerda", "Manga Direita", "Gola", "Bolso",
    },
    "Camisa Longa": {
        "Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
        "Costas — Centro Alto", "Costas — Centro Baixo",
        "Manga Esquerda", "Manga Direita", "Ambas as Mangas",
        "Punho Esquerdo", "Punho Direito", "Gola",
    },
    "Moletom c/ Capuz": {
        "Frente — Centro", "Frente — Peito Esquerdo",
        "Costas — Centro Alto", "Costas — Full Back",
        "Manga Esquerda", "Manga Direita", "Capuz", "Bolso",
    },
    "Calça": {"Coxa Direita", "Coxa Esquerda", "Lateral da Perna",
               "Parte Traseira", "Bolso Traseiro", "Barra"},
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


# ---------- QR Code por item ----------

@pedidos_bp.route('/pedidos/itens/<int:item_id>/qrcode', methods=['GET'])
@login_required
def qrcode_item(item_id):
    with db_cursor() as cursor:
        cursor.execute(
            """SELECT pi.id FROM pedido_itens pi
               JOIN pedidos p ON p.id = pi.pedido_id
               WHERE pi.id = %s AND p.excluido_em IS NULL""",
            (item_id,)
        )
        if not cursor.fetchone():
            return jsonify(success=False, msg='Item não encontrado.'), 404
    from gerador_qrcode import gerar_qrcode_item
    buf = gerar_qrcode_item(item_id)
    return send_file(buf, mimetype='image/png')


# ---------- Buscar item individual (para VisualizarItem) ----------

@pedidos_bp.route('/pedidos/itens/<int:item_id>', methods=['GET'])
@login_required
def buscar_item_pedido(item_id):
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT
                pi.id,
                pi.pedido_id,
                pi.observacao,
                pi.estoque_id,
                (pi.imagem_dados IS NOT NULL) AS tem_arte,
                p.numero_pedido,
                cp.nome  AS nome_produto,
                ct.nome  AS tecido,
                cc.nome  AS cor,
                cpe.nome AS personalizacao,
                cl.nome  AS local_arte
            FROM pedido_itens pi
            JOIN pedidos p             ON p.id  = pi.pedido_id
            JOIN catalogo_itens cp     ON cp.id = pi.tipo_produto_id
            JOIN catalogo_itens ct     ON ct.id = pi.tecido_id
            JOIN catalogo_itens cc     ON cc.id = pi.cor_id
            LEFT JOIN catalogo_itens cpe ON cpe.id = pi.personalizacao_id
            JOIN catalogo_itens cl     ON cl.id = pi.local_arte_id
            WHERE pi.id = %s AND p.excluido_em IS NULL
        """, (item_id,))
        item = cursor.fetchone()

        if not item:
            return jsonify(success=False, msg='Item não encontrado.'), 404

        cursor.execute("""
            SELECT tamanho, quantidade
            FROM pedido_item_tamanhos
            WHERE pedido_item_id = %s
            ORDER BY tamanho
        """, (item_id,))
        tamanhos = cursor.fetchall()

    item['tamanhos'] = tamanhos
    if item.get('tem_arte'):
        item['arte_url'] = f'/api/pedidos/itens/{item_id}/arte'
    if item.get('estoque_id'):
        item['foto_estoque_url'] = f'/api/estoque/{item["estoque_id"]}/imagem'
    return jsonify(success=True, data=item)


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
                pi.estoque_id,
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
    prioridade    = (dados.get('prioridade') or 'media').strip()
    obs_geral     = dados.get('obs_geral') or None
    produtos      = dados.get('produtos', [])
    contato       = (dados.get('contato') or '').strip() or None

    if prioridade not in ('baixa', 'media', 'alta'):
        prioridade = 'media'
    if not nome_cliente:
        return jsonify(success=False, msg='Nome do cliente é obrigatório.'), 400
    if not data_pedido:
        return jsonify(success=False, msg='Data do pedido é obrigatória.'), 400
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

            estoque_id = prod.get('estoque_id') or None

            cursor.execute("""
                INSERT INTO pedido_itens
                    (pedido_id, tipo_produto_id, personalizacao_id,
                     tecido_id, cor_id, local_arte_id, observacao,
                     imagem_mime, imagem_dados, estoque_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                pedido_id, tipo_produto_id, personalizacao_id,
                tecido_id, cor_id, local_id,
                detalhes.get('observacao') or None,
                imagem_mime, imagem_dados, estoque_id,
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

    # Conclusão (em_producao → concluido): sem baixa de estoque
    if novo_status == 'concluido':
        with db_cursor(commit=True) as cursor:
            cursor.execute(
                "SELECT status FROM pedidos WHERE id = %s AND excluido_em IS NULL",
                (pedido_id,)
            )
            pedido = cursor.fetchone()
            if not pedido:
                return jsonify(success=False, msg='Pedido não encontrado.'), 404
            if transicoes_validas.get(pedido['status']) != 'concluido':
                return jsonify(success=False, msg='Transição de status não permitida.'), 400
            cursor.execute(
                "UPDATE pedidos SET status = 'concluido', data_conclusao = NOW() WHERE id = %s",
                (pedido_id,)
            )
        return jsonify(success=True)

    # Início da produção (pendente → em_producao): baixa automática de estoque
    colaborador_id = g.colaborador['id']
    conn = open_connection()
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)

        cursor.execute(
            "SELECT status FROM pedidos WHERE id = %s AND excluido_em IS NULL FOR UPDATE",
            (pedido_id,)
        )
        pedido = cursor.fetchone()
        if not pedido:
            cursor.close()
            return jsonify(success=False, msg='Pedido não encontrado.'), 404
        if pedido['status'] != 'pendente':
            cursor.close()
            return jsonify(success=False, msg='Transição de status não permitida.'), 400

        # Proteção contra baixa duplicada: verifica se já houve movimentação
        cursor.execute(
            "SELECT COUNT(*) AS c FROM estoque_movimentacoes "
            "WHERE tipo = 'saida' AND motivo LIKE CONCAT('Baixa automática — Pedido #', %s, '%%')",
            (str(pedido_id),)
        )
        if cursor.fetchone()['c'] > 0:
            cursor.execute(
                "UPDATE pedidos SET status = 'em_producao' WHERE id = %s",
                (pedido_id,)
            )
            conn.commit()
            cursor.close()
            return jsonify(success=True)

        # Busca itens com estoque vinculado (apenas unidade_medida = 'Unidade')
        cursor.execute("""
            SELECT pi.estoque_id,
                   e.nome_item,
                   COALESCE(SUM(pit.quantidade), 0) AS total_pedido
            FROM pedido_itens pi
            JOIN estoque e ON e.id = pi.estoque_id
            LEFT JOIN pedido_item_tamanhos pit ON pit.pedido_item_id = pi.id
            WHERE pi.pedido_id = %s
              AND pi.estoque_id IS NOT NULL
              AND e.unidade_medida = 'Unidade'
            GROUP BY pi.estoque_id, e.nome_item
        """, (pedido_id,))
        itens_baixa = cursor.fetchall()

        if itens_baixa:
            ids_est = sorted({i['estoque_id'] for i in itens_baixa})
            fmt_est = ','.join(['%s'] * len(ids_est))
            cursor.execute(
                f"SELECT id, quantidade_atual FROM estoque WHERE id IN ({fmt_est}) FOR UPDATE",
                ids_est
            )
            saldos = {r['id']: float(r['quantidade_atual']) for r in cursor.fetchall()}

            insuficientes = []
            for it in itens_baixa:
                total = float(it['total_pedido'])
                disp = saldos.get(it['estoque_id'], 0)
                if total > disp:
                    insuficientes.append(
                        f"{it['nome_item']} (solicitado: {int(total)}, disponível: {int(disp)})"
                    )

            if insuficientes:
                conn.rollback()
                cursor.close()
                return jsonify(
                    success=False,
                    msg=f"Estoque insuficiente para iniciar o pedido. {'; '.join(insuficientes)}."
                ), 409

            for it in itens_baixa:
                total = float(it['total_pedido'])
                if total <= 0:
                    continue
                cursor.execute(
                    "UPDATE estoque SET quantidade_atual = quantidade_atual - %s WHERE id = %s",
                    (total, it['estoque_id'])
                )
                cursor.execute("""
                    INSERT INTO estoque_movimentacoes
                        (estoque_id, tipo, quantidade, motivo, colaborador_id)
                    VALUES (%s, 'saida', %s, %s, %s)
                """, (
                    it['estoque_id'], total,
                    f'Baixa automática — Pedido #{pedido_id}',
                    colaborador_id,
                ))

        cursor.execute(
            "UPDATE pedidos SET status = 'em_producao' WHERE id = %s",
            (pedido_id,)
        )
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


# ---------- atualizar pedido (via solicitação aprovada) ----------

@pedidos_bp.route('/pedidos/<int:pedido_id>', methods=['PUT'])
@login_required
def atualizar_pedido(pedido_id):
    import base64 as _b64
    dados = request.get_json(silent=True) or {}

    ficha        = dados.get('ficha') or {}
    pedido_data  = dados.get('pedido') or {}
    produtos     = pedido_data.get('produtos') or []

    conn = open_connection()
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)

        cursor.execute(
            "SELECT id, cliente_id, status FROM pedidos WHERE id = %s AND excluido_em IS NULL",
            (pedido_id,)
        )
        pedido_row = cursor.fetchone()
        if not pedido_row:
            cursor.close()
            conn.close()
            return jsonify(success=False, msg='Pedido não encontrado.'), 404

        pedido_ja_iniciado = pedido_row['status'] != 'pendente'

        # ── Snapshot ANTES: totais por estoque_id (apenas Unidade) ──
        cursor.execute("""
            SELECT pi.estoque_id,
                   COALESCE(SUM(pit.quantidade), 0) AS total
            FROM pedido_itens pi
            JOIN estoque e ON e.id = pi.estoque_id
            LEFT JOIN pedido_item_tamanhos pit ON pit.pedido_item_id = pi.id
            WHERE pi.pedido_id = %s
              AND pi.estoque_id IS NOT NULL
              AND e.unidade_medida = 'Unidade'
            GROUP BY pi.estoque_id
        """, (pedido_id,))
        totais_antes = {r['estoque_id']: float(r['total']) for r in cursor.fetchall()}

        # Atualiza campos da ficha no pedido
        campos_ped = {}
        if 'entrega' in ficha:
            campos_ped['prazo_entrega'] = ficha['entrega'] or None
        if 'dataPedido' in ficha:
            campos_ped['data_pedido'] = ficha['dataPedido'] or None
        if 'observacao' in ficha:
            campos_ped['obs_geral'] = ficha['observacao'] or None

        if campos_ped:
            sets = ', '.join(f"{k} = %s" for k in campos_ped)
            cursor.execute(
                f"UPDATE pedidos SET {sets} WHERE id = %s",
                [*campos_ped.values(), pedido_id]
            )

        # Atualiza cliente
        if ficha.get('cliente') and pedido_row['cliente_id']:
            cursor.execute(
                "UPDATE clientes SET nome=%s, telefone=%s, email=%s WHERE id=%s",
                (
                    ficha['cliente'].strip(),
                    (ficha.get('contato') or '').strip() or None,
                    (ficha.get('email') or '').strip() or None,
                    pedido_row['cliente_id'],
                )
            )

        ids_processados = []

        for prod in produtos:
            item_nome = (prod.get('item') or '').strip()
            if not item_nome:
                continue

            detalhes   = prod.get('detalhes') or {}
            grade      = prod.get('grade') or {}
            item_id    = detalhes.get('id')
            estoque_id = prod.get('estoque_id') or detalhes.get('estoque_id') or None

            tipo_produto_id   = _resolver_catalogo(cursor, 'produto', item_nome)
            personalizacao_id = _resolver_catalogo(cursor, 'personalizacao', detalhes.get('personalizacao'))
            tecido_id         = _resolver_catalogo(cursor, 'tecido', detalhes.get('tecido'))
            cor_id            = _resolver_catalogo(cursor, 'cor', detalhes.get('cor'))
            local_id          = _resolver_catalogo(cursor, 'local', detalhes.get('local'))

            if not tecido_id or not cor_id or not local_id:
                conn.rollback()
                cursor.close()
                conn.close()
                return jsonify(
                    success=False,
                    msg=f'Preencha Tecido, Cor e Local da Arte para "{item_nome}".'
                ), 400

            # Decodifica arte nova (base64), se enviada
            img_bytes = img_mime = None
            arte_nova = detalhes.get('arteNova')
            if arte_nova and isinstance(arte_nova, str) and ',' in arte_nova:
                try:
                    header, encoded = arte_nova.split(',', 1)
                    img_mime  = header.split(':')[1].split(';')[0] if ':' in header else 'image/png'
                    img_bytes = _b64.b64decode(encoded)
                except Exception:
                    pass

            if item_id:
                # Item existente — UPDATE
                ids_processados.append(item_id)
                if img_bytes is not None:
                    cursor.execute("""
                        UPDATE pedido_itens
                        SET tipo_produto_id=%s, personalizacao_id=%s, tecido_id=%s,
                            cor_id=%s, local_arte_id=%s, observacao=%s,
                            estoque_id=%s, imagem_dados=%s, imagem_mime=%s, imagem_url=NULL
                        WHERE id=%s AND pedido_id=%s
                    """, (tipo_produto_id, personalizacao_id, tecido_id, cor_id, local_id,
                          detalhes.get('observacao') or None, estoque_id,
                          img_bytes, img_mime, item_id, pedido_id))
                else:
                    cursor.execute("""
                        UPDATE pedido_itens
                        SET tipo_produto_id=%s, personalizacao_id=%s, tecido_id=%s,
                            cor_id=%s, local_arte_id=%s, observacao=%s, estoque_id=%s
                        WHERE id=%s AND pedido_id=%s
                    """, (tipo_produto_id, personalizacao_id, tecido_id, cor_id, local_id,
                          detalhes.get('observacao') or None, estoque_id,
                          item_id, pedido_id))

                # Substitui grade
                cursor.execute(
                    "DELETE FROM pedido_item_tamanhos WHERE pedido_item_id=%s", (item_id,)
                )
                for tamanho, quantidade in grade.items():
                    try:
                        qtd = int(quantidade)
                    except (TypeError, ValueError):
                        qtd = 0
                    if qtd > 0:
                        cursor.execute(
                            "INSERT INTO pedido_item_tamanhos (pedido_item_id, tamanho, quantidade) VALUES (%s,%s,%s)",
                            (item_id, tamanho, qtd)
                        )
            else:
                # Item novo — INSERT
                cursor.execute("""
                    INSERT INTO pedido_itens
                        (pedido_id, tipo_produto_id, personalizacao_id, tecido_id, cor_id,
                         local_arte_id, observacao, imagem_mime, imagem_dados, estoque_id)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (pedido_id, tipo_produto_id, personalizacao_id, tecido_id, cor_id,
                      local_id, detalhes.get('observacao') or None,
                      img_mime, img_bytes, estoque_id))
                novo_id = cursor.lastrowid
                ids_processados.append(novo_id)

                for tamanho, quantidade in grade.items():
                    try:
                        qtd = int(quantidade)
                    except (TypeError, ValueError):
                        qtd = 0
                    if qtd > 0:
                        cursor.execute(
                            "INSERT INTO pedido_item_tamanhos (pedido_item_id, tamanho, quantidade) VALUES (%s,%s,%s)",
                            (novo_id, tamanho, qtd)
                        )

        # Remove itens que foram excluídos na edição
        if ids_processados:
            fmt = ','.join(['%s'] * len(ids_processados))
            cursor.execute(
                f"SELECT id FROM pedido_itens WHERE pedido_id=%s AND id NOT IN ({fmt})",
                [pedido_id, *ids_processados]
            )
            ids_remover = [r['id'] for r in cursor.fetchall()]
            if ids_remover:
                fmt2 = ','.join(['%s'] * len(ids_remover))
                cursor.execute(
                    f"DELETE FROM pedido_item_tamanhos WHERE pedido_item_id IN ({fmt2})",
                    ids_remover
                )
                cursor.execute(
                    f"DELETE FROM pedido_itens WHERE id IN ({fmt2})",
                    ids_remover
                )

        # ── Ajuste diferencial de estoque (somente se o pedido já foi iniciado) ──
        if pedido_ja_iniciado:
            cursor.execute("""
                SELECT pi.estoque_id,
                       e.nome_item,
                       COALESCE(SUM(pit.quantidade), 0) AS total
                FROM pedido_itens pi
                JOIN estoque e ON e.id = pi.estoque_id
                LEFT JOIN pedido_item_tamanhos pit ON pit.pedido_item_id = pi.id
                WHERE pi.pedido_id = %s
                  AND pi.estoque_id IS NOT NULL
                  AND e.unidade_medida = 'Unidade'
                GROUP BY pi.estoque_id, e.nome_item
            """, (pedido_id,))
            totais_depois = {r['estoque_id']: (float(r['total']), r['nome_item'])
                             for r in cursor.fetchall()}

            todos_ids = set(totais_antes) | set(totais_depois)
            if todos_ids:
                fmt_lock = ','.join(['%s'] * len(todos_ids))
                ids_lock = sorted(todos_ids)
                cursor.execute(
                    f"SELECT id, quantidade_atual FROM estoque WHERE id IN ({fmt_lock}) FOR UPDATE",
                    ids_lock
                )
                saldos = {r['id']: float(r['quantidade_atual']) for r in cursor.fetchall()}

                colaborador_id = g.colaborador['id']
                insuficientes = []

                for eid in todos_ids:
                    antes = totais_antes.get(eid, 0)
                    depois_total, nome = totais_depois.get(eid, (0, ''))
                    diff = depois_total - antes

                    if diff == 0:
                        continue

                    if diff > 0:
                        disp = saldos.get(eid, 0)
                        if diff > disp:
                            if not nome:
                                nome = f'ID {eid}'
                            insuficientes.append(
                                f"{nome} (adicional: {int(diff)}, disponível: {int(disp)})"
                            )

                if insuficientes:
                    conn.rollback()
                    cursor.close()
                    return jsonify(
                        success=False,
                        msg=f"Estoque insuficiente: {'; '.join(insuficientes)}."
                    ), 409

                for eid in todos_ids:
                    antes = totais_antes.get(eid, 0)
                    depois_total, nome = totais_depois.get(eid, (0, ''))
                    diff = depois_total - antes

                    if diff == 0:
                        continue

                    if diff > 0:
                        cursor.execute(
                            "UPDATE estoque SET quantidade_atual = quantidade_atual - %s WHERE id = %s",
                            (diff, eid)
                        )
                        cursor.execute("""
                            INSERT INTO estoque_movimentacoes
                                (estoque_id, tipo, quantidade, motivo, colaborador_id)
                            VALUES (%s, 'saida', %s, %s, %s)
                        """, (eid, diff,
                              f'Saída por edição — Pedido #{pedido_id} (aumento de {int(antes)} → {int(depois_total)})',
                              colaborador_id))
                    else:
                        devolucao = abs(diff)
                        cursor.execute(
                            "SELECT COUNT(*) AS c FROM estoque_movimentacoes "
                            "WHERE estoque_id = %s AND tipo = 'saida' "
                            "AND motivo LIKE CONCAT('Baixa automática — Pedido #', %s, '%%')",
                            (eid, str(pedido_id))
                        )
                        tem_mov = cursor.fetchone()['c'] > 0
                        if tem_mov:
                            cursor.execute(
                                "UPDATE estoque SET quantidade_atual = quantidade_atual + %s WHERE id = %s",
                                (devolucao, eid)
                            )
                            cursor.execute("""
                                INSERT INTO estoque_movimentacoes
                                    (estoque_id, tipo, quantidade, motivo, colaborador_id)
                                VALUES (%s, 'entrada', %s, %s, %s)
                            """, (eid, devolucao,
                                  f'Devolução por edição — Pedido #{pedido_id} (redução de {int(antes)} → {int(depois_total)})',
                                  colaborador_id))

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
