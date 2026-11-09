import io
import json
from hashlib import sha256
from decimal import Decimal, InvalidOperation

from mysql.connector import IntegrityError

from flask import Blueprint, request, jsonify, send_file
from auth.decorators import login_required
from resources.controle_estoque import FILTRO_ESTOQUE_PECAS
import resources.database_connection as database_connection


estoque_bp = Blueprint('estoque', __name__)


def _numero_cor(valor, campo):
    try:
        numero = Decimal(str(valor if valor not in (None, '') else 0))
    except (InvalidOperation, ValueError):
        raise ValueError(f'{campo} deve ser um número válido.')
    if not numero.is_finite() or numero < 0 or numero > Decimal('99999999.99'):
        raise ValueError(f'{campo} deve estar entre 0 e 99999999,99.')
    if numero != numero.quantize(Decimal('0.01')):
        raise ValueError(f'{campo} deve ter no máximo duas casas decimais.')
    return numero


def _validar_variacoes(dados):
    valor = str(dados.get('tem_variacoes', False)).lower()
    if valor not in ('true', 'false', '1', '0'):
        raise ValueError('tem_variacoes deve ser booleano.')
    tem_variacoes = valor in ('true', '1')
    cores = dados.get('cores', [])
    if isinstance(cores, str):
        try:
            cores = json.loads(cores)
        except ValueError:
            raise ValueError('Cores deve ser um array JSON válido.')
    if not isinstance(cores, list):
        raise ValueError('Cores deve ser uma lista.')
    if tem_variacoes and dados.get('tipo_item') != 'material':
        raise ValueError('Somente materiais podem possuir variações de cor.')
    nomes, ids, resultado = set(), set(), []
    for cor in cores:
        if not isinstance(cor, dict):
            raise ValueError('Cada cor deve ser um objeto.')
        if not any(v not in (None, '') for v in cor.values()):
            continue
        nome = cor.get('nome_cor', '')
        if not isinstance(nome, str) or not nome.strip() or len(nome.strip()) > 100:
            raise ValueError('Informe o nome de cada cor (até 100 caracteres).')
        nome = nome.strip()
        if nome.casefold() in nomes:
            raise ValueError('Não são permitidos nomes de cor repetidos no mesmo tecido.')
        nomes.add(nome.casefold())
        cor_id = cor.get('id')
        if cor_id is not None:
            if isinstance(cor_id, bool) or not str(cor_id).isdigit() or int(cor_id) < 1:
                raise ValueError('ID de cor inválido.')
            cor_id = int(cor_id)
            if cor_id in ids:
                raise ValueError('ID de cor repetido.')
            ids.add(cor_id)
        resultado.append(dict(id=cor_id, nome_cor=nome,
                              quantidade_atual=_numero_cor(cor.get('quantidade_atual'), 'Metros'),
                              estoque_minimo=_numero_cor(cor.get('estoque_minimo'), 'Estoque mínimo')))
    if tem_variacoes and not resultado:
        raise ValueError('Informe ao menos uma cor com nome preenchido.')
    if not tem_variacoes and resultado:
        raise ValueError('Ative as variações para enviar cores.')
    return tem_variacoes, resultado


def _salvar_cores(cursor, material_id, cores):
    cursor.execute('SELECT id FROM material_cores WHERE material_id = %s FOR UPDATE', (material_id,))
    existentes = {linha['id'] for linha in cursor.fetchall()}
    enviados = {cor['id'] for cor in cores if cor['id'] is not None}
    if not enviados.issubset(existentes):
        raise ValueError('Uma das cores não pertence a este material.')
    for cor_id in existentes - enviados:
        cursor.execute('SELECT id FROM pedido_itens WHERE material_cor_id = %s LIMIT 1', (cor_id,))
        if cursor.fetchone():
            raise ValueError('Não é possível remover uma cor vinculada a pedido.')
        cursor.execute('DELETE FROM material_cores WHERE id = %s AND material_id = %s', (cor_id, material_id))
    for cor in cores:
        valores = (cor['nome_cor'], cor['quantidade_atual'], cor['estoque_minimo'])
        if cor['id'] is None:
            cursor.execute(
                'INSERT INTO material_cores (nome_cor, quantidade_atual, estoque_minimo, material_id) '
                'VALUES (%s, %s, %s, %s)', valores + (material_id,))
        else:
            cursor.execute(
                'UPDATE material_cores SET nome_cor=%s, quantidade_atual=%s, estoque_minimo=%s '
                'WHERE id=%s AND material_id=%s', valores + (cor['id'], material_id))


def _anexar_cores(cursor, materiais):
    mapa = {item['id']: item for item in materiais}
    for item in materiais:
        item['tem_variacoes'] = bool(item['tem_variacoes'])
        item['cores'] = []
    if not mapa:
        return
    marcadores = ','.join(['%s'] * len(mapa))
    cursor.execute(
        'SELECT id, material_id, nome_cor, codigo_hex, quantidade_atual, estoque_minimo, '
        f'valor_unitario, created_at, updated_at FROM material_cores WHERE material_id IN ({marcadores}) '
        'ORDER BY id', tuple(mapa))
    for cor in cursor.fetchall():
        mapa[cor['material_id']]['cores'].append(cor)


# ==================================================
# CADASTRAR ITEM NO ESTOQUE
# ==================================================

@estoque_bp.route('/cadastrar-estoque', methods=['POST'])
@login_required
def cadastrar_estoque():

    dados = request.get_json(silent=True) if request.is_json else request.form
    if request.is_json and not isinstance(dados, dict):
        return jsonify(message='Informe um objeto JSON.', success=False), 400
    try:
        tem_variacoes, cores = _validar_variacoes(dados)
    except ValueError as erro:
        return jsonify(message=str(erro), success=False), 400

    tipo_item        = dados.get('tipo_item')
    nome_item        = dados.get('nome_item')
    fornecedor       = dados.get('fornecedor') or None
    quantidade_atual = dados.get('quantidade_atual', 0)
    estoque_minimo   = dados.get('estoque_minimo', 0)
    valor_unitario   = dados.get('valor_unitario') or None
    observacoes      = dados.get('observacoes') or None

    if tem_variacoes:
        quantidade_atual = 0
        estoque_minimo = 0

    arquivo   = request.files.get('imagem')
    img_dados = arquivo.read() if arquivo else None
    img_mime  = (arquivo.content_type or None) if arquivo else None

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)

        SQL = """
            INSERT INTO estoque (
                tipo_item, nome_item,
                fornecedor, quantidade_atual, estoque_minimo,
                valor_unitario, observacoes,
                imagem_mime, imagem_dados, tem_variacoes
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """

        values = (
            tipo_item, nome_item,
            fornecedor, quantidade_atual, estoque_minimo,
            valor_unitario, observacoes,
            img_mime, img_dados, tem_variacoes,
        )

        cursor.execute(SQL, values)
        material_id = cursor.lastrowid
        _salvar_cores(cursor, material_id, cores)
        connection.commit()

        return jsonify({
            'message': 'Item cadastrado com sucesso!',
            'success': True,
            'id': material_id,
        }), 201

    except (ValueError, IntegrityError) as erro:
        if connection:
            connection.rollback()
        mensagem = str(erro) if isinstance(erro, ValueError) else 'Operação bloqueada por vínculo existente ou dado inválido. Cores usadas em pedidos não podem ser removidas.'
        return jsonify(message=mensagem, success=False), 400

    except Exception as erro:
        if connection:
            connection.rollback()

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
@login_required
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
                valor_unitario, observacoes, catalogo_item_id, tem_variacoes,
                (imagem_dados IS NOT NULL) AS tem_imagem
            FROM estoque
            WHERE ativo = 1
            ORDER BY id DESC;
        """

        cursor.execute(SQL)

        estoque = cursor.fetchall()
        _anexar_cores(cursor, estoque)

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

@estoque_bp.route('/estoque/tecidos', methods=['GET'])
@login_required
def listar_tecidos():
    connection = None
    cursor = None
    try:
        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, nome_item, tem_variacoes FROM estoque "
            "WHERE ativo = 1 "
            "AND tem_variacoes = 1 ORDER BY nome_item, id")
        materiais = cursor.fetchall()
        _anexar_cores(cursor, materiais)
        return jsonify(materiais), 200
    except Exception:
        return jsonify(message='Erro ao carregar tecidos.', success=False), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@estoque_bp.route('/estoque/<int:id>', methods=['GET'])
@login_required
def buscar_item(id):

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()

        cursor = connection.cursor(dictionary=True)

        SQL = """
            SELECT id, tipo_item, nome_item, categoria, unidade_medida,
                   fornecedor, quantidade_atual, estoque_minimo,
                   valor_unitario, observacoes, catalogo_item_id, tem_variacoes,
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

        _anexar_cores(cursor, [item])
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
@login_required
def editar_estoque(id):

    dados = request.get_json(silent=True) if request.is_json else request.form
    if request.is_json and not isinstance(dados, dict):
        return jsonify(message='Informe um objeto JSON.', success=False), 400
    try:
        tem_variacoes, cores = _validar_variacoes(dados)
    except ValueError as erro:
        return jsonify(message=str(erro), success=False), 400

    tipo_item        = dados.get('tipo_item')
    nome_item        = dados.get('nome_item')
    fornecedor       = dados.get('fornecedor') or None
    quantidade_atual = dados.get('quantidade_atual')
    estoque_minimo   = dados.get('estoque_minimo')
    valor_unitario   = dados.get('valor_unitario') or None
    observacoes      = dados.get('observacoes') or None

    if tem_variacoes:
        quantidade_atual = 0
        estoque_minimo = 0

    arquivo   = request.files.get('imagem')
    tem_nova_imagem = arquivo is not None

    connection = None
    cursor = None

    try:

        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute('SELECT id, tem_variacoes FROM estoque WHERE id = %s FOR UPDATE', (id,))
        existente = cursor.fetchone()
        if existente is None:
            connection.rollback()
            return jsonify(message='Item não encontrado.', success=False), 404
        if existente['tem_variacoes'] and 'tem_variacoes' not in dados:
            raise ValueError('Envie tem_variacoes e a lista de cores para editar este tecido.')
        if existente['tem_variacoes'] and tem_variacoes and 'cores' not in dados:
            raise ValueError('Envie a lista completa de cores para editar este tecido.')
        _salvar_cores(cursor, id, cores)

        if tem_nova_imagem:
            img_dados = arquivo.read()
            img_mime  = arquivo.content_type or None
            SQL = """
                UPDATE estoque
                SET tipo_item=%s, nome_item=%s,
                    fornecedor=%s, quantidade_atual=%s, estoque_minimo=%s,
                    valor_unitario=%s, observacoes=%s,
                    imagem_mime=%s, imagem_dados=%s, tem_variacoes=%s
                WHERE id=%s;
            """
            values = (
                tipo_item, nome_item,
                fornecedor, quantidade_atual, estoque_minimo,
                valor_unitario, observacoes,
                img_mime, img_dados, tem_variacoes, id,
            )
        else:
            SQL = """
                UPDATE estoque
                SET tipo_item=%s, nome_item=%s,
                    fornecedor=%s, quantidade_atual=%s, estoque_minimo=%s,
                    valor_unitario=%s, observacoes=%s, tem_variacoes=%s
                WHERE id=%s;
            """
            values = (
                tipo_item, nome_item,
                fornecedor, quantidade_atual, estoque_minimo,
                valor_unitario, observacoes, tem_variacoes, id,
            )

        cursor.execute(SQL, values)
        connection.commit()

        return jsonify({
            'message': 'Item atualizado com sucesso!',
            'success': True
        }), 200

    except (ValueError, IntegrityError) as erro:
        if connection:
            connection.rollback()
        mensagem = str(erro) if isinstance(erro, ValueError) else 'Operação bloqueada por vínculo existente ou dado inválido. Cores usadas em pedidos não podem ser removidas.'
        return jsonify(message=mensagem, success=False), 400

    except Exception as erro:
        if connection:
            connection.rollback()

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
@login_required
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
@login_required
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
        dados = bytes(row['imagem_dados'])
        buf = io.BytesIO(dados)
        mime = row['imagem_mime'] or 'image/png'
        # Muda quando o conteúdo ou o tipo mudam, sem coluna de versão no banco.
        versao = sha256(mime.encode('utf-8') + b'\0' + dados).hexdigest()
        return send_file(buf, mimetype=mime, etag=versao, conditional=True, max_age=0)
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

@estoque_bp.route('/estoque/produtos-pedido', methods=['GET'])
@login_required
def listar_produtos_pedido():
    connection = None
    cursor = None
    try:
        connection = database_connection.open_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, nome_item AS nome, quantidade_atual, estoque_minimo, "
            "(imagem_dados IS NOT NULL AND OCTET_LENGTH(imagem_dados) > 0) AS tem_imagem FROM estoque "
            "WHERE tipo_item = 'produto' AND ativo = 1 AND tem_variacoes = 0 "
            "ORDER BY nome_item, id")
        return jsonify(cursor.fetchall()), 200
    except Exception:
        return jsonify(message='Erro ao carregar produtos do estoque.', success=False), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@estoque_bp.route('/catalogo/produtos', methods=['GET'])
@login_required
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
@login_required
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
@login_required
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
            f"SELECT e.id, e.nome_item, e.quantidade_atual, "
            f"{FILTRO_ESTOQUE_PECAS} AS controla_pecas "
            f"FROM estoque e WHERE e.id IN ({fmt}) AND e.ativo = 1",
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

            if not info['controla_pecas']:
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
