from flask import Blueprint, request, jsonify
import resources.database_connection as database_connection


estoque_bp = Blueprint('estoque', __name__)


# ==================================================
# CADASTRAR ITEM NO ESTOQUE
# ==================================================

@estoque_bp.route('/cadastrar-estoque', methods=['POST'])
def cadastrar_estoque():

    dados = request.get_json()

    tipo_item = dados.get('tipo_item')
    nome_item = dados.get('nome_item')
    categoria = dados.get('categoria')
    unidade_medida = dados.get('unidade_medida')
    fornecedor = dados.get('fornecedor')
    quantidade_atual = dados.get('quantidade_atual', 0)
    estoque_minimo = dados.get('estoque_minimo', 0)
    valor_unitario = dados.get('valor_unitario')
    observacoes = dados.get('observacoes')

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()
        cursor = connection.cursor()

        SQL = """
            INSERT INTO estoque (
                tipo_item,
                nome_item,
                categoria,
                unidade_medida,
                fornecedor,
                quantidade_atual,
                estoque_minimo,
                valor_unitario,
                observacoes
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
        """

        values = (
            tipo_item,
            nome_item,
            categoria,
            unidade_medida,
            fornecedor,
            quantidade_atual,
            estoque_minimo,
            valor_unitario,
            observacoes
        )

        cursor.execute(SQL, values)

        connection.commit()

        return jsonify({
            'message': 'Item cadastrado com sucesso!',
            'success': True
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
                id,
                tipo_item,
                nome_item,
                categoria,
                unidade_medida,
                fornecedor,
                quantidade_atual,
                estoque_minimo,
                valor_unitario,
                observacoes
            FROM estoque
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
            SELECT *
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

    dados = request.get_json()

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()

        cursor = connection.cursor()

        SQL = """
            UPDATE estoque

            SET
                tipo_item = %s,
                nome_item = %s,
                categoria = %s,
                unidade_medida = %s,
                fornecedor = %s,
                quantidade_atual = %s,
                estoque_minimo = %s,
                valor_unitario = %s,
                observacoes = %s

            WHERE id = %s;
        """

        values = (
            dados.get('tipo_item'),
            dados.get('nome_item'),
            dados.get('categoria'),
            dados.get('unidade_medida'),
            dados.get('fornecedor'),
            dados.get('quantidade_atual'),
            dados.get('estoque_minimo'),
            dados.get('valor_unitario'),
            dados.get('observacoes'),
            id
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

        cursor = connection.cursor()

        SQL = """
            DELETE FROM estoque
            WHERE id = %s;
        """

        cursor.execute(SQL, (id,))

        connection.commit()

        if cursor.rowcount == 0:

            return jsonify({
                'message': 'Item não encontrado.',
                'success': False
            }), 404

        return jsonify({
            'message': 'Item excluído com sucesso!',
            'success': True
        }), 200

    except Exception as erro:

        return jsonify({
            'message': 'Erro ao excluir item.',
            'erro': str(erro),
            'success': False
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()