import io

from flask import Blueprint, request, jsonify, send_file
import resources.database_connection as database_connection


estoque_bp = Blueprint('estoque', __name__)


# ==================================================
# CADASTRAR ITEM NO ESTOQUE
# ==================================================

@estoque_bp.route('/cadastrar-estoque', methods=['POST'])
def cadastrar_estoque():

    tipo_item        = request.form.get('tipo_item')
    nome_item        = request.form.get('nome_item')
    categoria        = request.form.get('categoria')
    unidade_medida   = request.form.get('unidade_medida')
    fornecedor       = request.form.get('fornecedor') or None
    quantidade_atual = request.form.get('quantidade_atual', 0)
    estoque_minimo   = request.form.get('estoque_minimo', 0)
    valor_unitario   = request.form.get('valor_unitario') or None
    observacoes      = request.form.get('observacoes') or None
    catalogo_item_id = request.form.get('catalogo_item_id') or None

    arquivo   = request.files.get('imagem')
    img_dados = arquivo.read() if arquivo else None
    img_mime  = (arquivo.content_type or None) if arquivo else None

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()
        cursor = connection.cursor()

        SQL = """
            INSERT INTO estoque (
                tipo_item, nome_item, categoria, unidade_medida,
                fornecedor, quantidade_atual, estoque_minimo,
                valor_unitario, observacoes, catalogo_item_id,
                imagem_mime, imagem_dados
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """

        values = (
            tipo_item, nome_item, categoria, unidade_medida,
            fornecedor, quantidade_atual, estoque_minimo,
            valor_unitario, observacoes, catalogo_item_id,
            img_mime, img_dados,
        )

        cursor.execute(SQL, values)
        connection.commit()

        return jsonify({
            'message': 'Item cadastrado com sucesso!',
            'success': True,
            'id': cursor.lastrowid,
        }), 201

    except Exception as erro:

        print("ERRO AO CADASTRAR ESTOQUE:", erro)

        return jsonify({
            'message': 'Erro ao cadastrar item.',
            'erro': str(erro),
            'success': False
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==================================================
# LISTAR ESTOQUE
# ==================================================

@estoque_bp.route('/listar-estoque', methods=['GET'])
def listar_estoque():

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()

        cursor = connection.cursor(dictionary=True)

        SQL = """
            SELECT
                id, tipo_item, nome_item, categoria, unidade_medida,
                fornecedor, quantidade_atual, estoque_minimo,
                valor_unitario, observacoes, catalogo_item_id,
                (imagem_dados IS NOT NULL) AS tem_imagem
            FROM estoque
            WHERE ativo = 1
            ORDER BY id DESC;
        """

        cursor.execute(SQL)

        estoque = cursor.fetchall()

        return jsonify(estoque), 200

    except Exception as erro:

        print("ERRO AO LISTAR ESTOQUE:", erro)

        return jsonify({
            'message': 'Erro ao carregar estoque.',
            'erro': str(erro),
            'success': False
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==================================================
# BUSCAR ITEM
# ==================================================

@estoque_bp.route('/estoque/<int:id>', methods=['GET'])
def buscar_item(id):

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()

        cursor = connection.cursor(dictionary=True)

        SQL = """
            SELECT id, tipo_item, nome_item, categoria, unidade_medida,
                   fornecedor, quantidade_atual, estoque_minimo,
                   valor_unitario, observacoes, catalogo_item_id,
                   (imagem_dados IS NOT NULL) AS tem_imagem
            FROM estoque
            WHERE id = %s;
        """

        cursor.execute(SQL, (id,))

        item = cursor.fetchone()

        if item is None:

            return jsonify({
                'message': 'Item não encontrado.',
                'success': False
            }), 404

        return jsonify(item), 200

    except Exception as erro:

        return jsonify({
            'message': 'Erro ao buscar item.',
            'erro': str(erro),
            'success': False
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==================================================
# EDITAR ITEM
# ==================================================

@estoque_bp.route('/editar-estoque/<int:id>', methods=['PUT'])
def editar_estoque(id):

    tipo_item        = request.form.get('tipo_item')
    nome_item        = request.form.get('nome_item')
    categoria        = request.form.get('categoria')
    unidade_medida   = request.form.get('unidade_medida')
    fornecedor       = request.form.get('fornecedor') or None
    quantidade_atual = request.form.get('quantidade_atual')
    estoque_minimo   = request.form.get('estoque_minimo')
    valor_unitario   = request.form.get('valor_unitario') or None
    observacoes      = request.form.get('observacoes') or None
    catalogo_item_id = request.form.get('catalogo_item_id') or None

    arquivo   = request.files.get('imagem')
    tem_nova_imagem = arquivo is not None

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()
        cursor = connection.cursor()

        if tem_nova_imagem:
            img_dados = arquivo.read()
            img_mime  = arquivo.content_type or None
            SQL = """
                UPDATE estoque
                SET tipo_item=%s, nome_item=%s, categoria=%s, unidade_medida=%s,
                    fornecedor=%s, quantidade_atual=%s, estoque_minimo=%s,
                    valor_unitario=%s, observacoes=%s, catalogo_item_id=%s,
                    imagem_mime=%s, imagem_dados=%s
                WHERE id=%s;
            """
            values = (
                tipo_item, nome_item, categoria, unidade_medida,
                fornecedor, quantidade_atual, estoque_minimo,
                valor_unitario, observacoes, catalogo_item_id,
                img_mime, img_dados, id,
            )
        else:
            SQL = """
                UPDATE estoque
                SET tipo_item=%s, nome_item=%s, categoria=%s, unidade_medida=%s,
                    fornecedor=%s, quantidade_atual=%s, estoque_minimo=%s,
                    valor_unitario=%s, observacoes=%s, catalogo_item_id=%s
                WHERE id=%s;
            """
            values = (
                tipo_item, nome_item, categoria, unidade_medida,
                fornecedor, quantidade_atual, estoque_minimo,
                valor_unitario, observacoes, catalogo_item_id, id,
            )

        cursor.execute(SQL, values)
        connection.commit()

        if cursor.rowcount == 0:

            return jsonify({
                'message': 'Item não encontrado.',
                'success': False
            }), 404

        return jsonify({
            'message': 'Item atualizado com sucesso!',
            'success': True
        }), 200

    except Exception as erro:

        return jsonify({
            'message': 'Erro ao atualizar item.',
            'erro': str(erro),
            'success': False
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==================================================
# EXCLUIR ITEM
# ==================================================

@estoque_bp.route('/excluir-estoque/<int:id>', methods=['DELETE'])
def excluir_estoque(id):
    connection = None
    cursor = None
    try:
        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)

        # Usa inativação lógica para preservar integridade referencial
        # (pedido_itens tem FK RESTRICT para estoque — DELETE físico quebraria pedidos vinculados)
        cursor.execute("UPDATE estoque SET ativo = 0 WHERE id = %s AND ativo = 1", (id,))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'Item não encontrado ou já inativo.', 'success': False}), 404

        return jsonify({'message': 'Item excluído com sucesso!', 'success': True}), 200

    except Exception as erro:
        return jsonify({'message': 'Erro ao excluir item.', 'erro': str(erro), 'success': False}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# ==================================================
# SERVIR IMAGEM DO ESTOQUE
# ==================================================

@estoque_bp.route('/estoque/<int:id>/imagem', methods=['GET'])
def servir_imagem_estoque(id):
    connection = None
    cursor = None
    try:
        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT imagem_dados, imagem_mime FROM estoque WHERE id = %s", (id,)
        )
        row = cursor.fetchone()
        if not row or not row['imagem_dados']:
            return jsonify({'message': 'Imagem não encontrada.', 'success': False}), 404
        buf = io.BytesIO(row['imagem_dados'])
        mime = row['imagem_mime'] or 'image/png'
        return send_file(buf, mimetype=mime)
    except Exception as erro:
        return jsonify({'message': 'Erro ao servir imagem.', 'erro': str(erro), 'success': False}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# ==================================================
# LISTAR MODELOS DO CATÁLOGO (para select de produto)
# ==================================================

@estoque_bp.route('/catalogo/produtos', methods=['GET'])
def listar_catalogo_produtos():
    connection = None
    cursor = None
    try:
        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, nome FROM catalogo_itens WHERE tipo = 'produto' AND ativo = 1 ORDER BY nome"
        )
        itens = cursor.fetchall()
        return jsonify(itens), 200
    except Exception as erro:
        return jsonify({'message': 'Erro ao listar catálogo.', 'erro': str(erro), 'success': False}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# ==================================================
# BUSCAR ITENS DE ESTOQUE POR MODELO DO CATÁLOGO
# ==================================================

@estoque_bp.route('/estoque/por-catalogo/<int:catalogo_item_id>', methods=['GET'])
def estoque_por_catalogo(catalogo_item_id):
    connection = None
    cursor = None
    try:
        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """SELECT id, nome_item, (imagem_dados IS NOT NULL) AS tem_imagem
               FROM estoque
               WHERE catalogo_item_id = %s AND tipo_item = 'produto' AND ativo = 1
               ORDER BY id""",
            (catalogo_item_id,)
        )
        itens = cursor.fetchall()
        return jsonify(itens), 200
    except Exception as erro:
        return jsonify({'message': 'Erro ao buscar itens.', 'erro': str(erro), 'success': False}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# ==================================================
# VERIFICAR DISPONIBILIDADE DE ESTOQUE
# ==================================================

@estoque_bp.route('/estoque/verificar-disponibilidade', methods=['POST'])
def verificar_disponibilidade():
    dados = request.get_json(silent=True) or {}
    itens = dados.get('itens') or []

    if not itens:
        return jsonify([]), 200

    connection = None
    cursor = None
    try:
        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)

        ids = list({i['estoque_id'] for i in itens if i.get('estoque_id')})
        if not ids:
            return jsonify([]), 200

        fmt = ','.join(['%s'] * len(ids))
        cursor.execute(
            f"SELECT id, nome_item, quantidade_atual, unidade_medida "
            f"FROM estoque WHERE id IN ({fmt}) AND ativo = 1",
            ids
        )
        mapa = {r['id']: r for r in cursor.fetchall()}

        agregado = {}
        for it in itens:
            eid = it.get('estoque_id')
            if not eid:
                continue
            agregado[eid] = agregado.get(eid, 0) + float(it.get('quantidade', 0))

        resultado = []
        for eid, qtd_pedida in agregado.items():
            info = mapa.get(eid)
            if not info:
                resultado.append({
                    'estoque_id': eid, 'disponivel': False,
                    'msg': 'Item não encontrado no estoque.'
                })
                continue

            if info['unidade_medida'] != 'Unidade':
                resultado.append({
                    'estoque_id': eid, 'disponivel': True,
                    'nome': info['nome_item'],
                    'msg': 'Controle por unidade não se aplica.'
                })
                continue

            disp = float(info['quantidade_atual'])
            ok = qtd_pedida <= disp
            resultado.append({
                'estoque_id': eid,
                'disponivel': ok,
                'nome': info['nome_item'],
                'quantidade_atual': disp,
                'quantidade_pedida': qtd_pedida,
                'msg': None if ok else f"Insuficiente: pedido {int(qtd_pedida)}, disponível {int(disp)}."
            })

        return jsonify(resultado), 200

    except Exception as erro:
        return jsonify({'message': 'Erro ao verificar disponibilidade.', 'erro': str(erro), 'success': False}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()