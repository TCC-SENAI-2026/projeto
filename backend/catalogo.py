from flask import Blueprint, request, jsonify
from auth.decorators import login_required
from database.connection import db_cursor

catalogo_bp = Blueprint('catalogo', __name__)


@catalogo_bp.route('/catalogo', methods=['GET'])
@login_required
def listar_catalogo():
    tipo = request.args.get('tipo', '').strip()
    tipos_validos = ('produto', 'personalizacao', 'tecido', 'cor', 'local')
    if tipo not in tipos_validos:
        return jsonify(success=False, msg='Tipo inválido.'), 400
    with db_cursor() as cursor:
        cursor.execute(
            "SELECT id, nome FROM catalogo_itens WHERE tipo = %s AND ativo = 1 ORDER BY nome",
            (tipo,)
        )
        itens = cursor.fetchall()
    return jsonify(success=True, data=itens)


@catalogo_bp.route('/clientes-pedido', methods=['GET'])
@login_required
def listar_clientes_pedido():
    with db_cursor() as cursor:
        cursor.execute(
            "SELECT id, nome, telefone, email FROM clientes WHERE ativo = 1 ORDER BY nome"
        )
        clientes = cursor.fetchall()
    return jsonify(success=True, data=clientes)
