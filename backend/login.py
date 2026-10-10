from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import resources.database_connection as database_connection
import resources.seguranca as seguranca

login_bp = Blueprint('login', __name__)

TAMANHO_MINIMO_SENHA = 8


def buscar_colaborador_pelo_token(cursor, token):
    """Retorna o colaborador dono do token, se o token existir e não tiver expirado."""
    SQL = """
        SELECT id_colaborador
        FROM colaboradores
        WHERE token_ativacao_hash = %s
          AND token_expira_em > NOW()
          AND ativo = 1;
    """
    cursor.execute(SQL, (seguranca.hash_token(token),))
    return cursor.fetchone()


@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    # "login" pode ser o RE ou o e-mail
    identificador = str(data.get('login', '')).strip()
    senha         = str(data.get('senha', ''))

    if not identificador or not senha:
        return jsonify({'msg': 'Login ou senha incorretos.', 'success': False}), 401

    conn = database_connection.open_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    SQL = """
        SELECT id_colaborador, nome_completo, nivel_acesso, senha_hash, ativo
        FROM colaboradores
        WHERE re = %s OR email = %s;
    """
    cursor.execute(SQL, (identificador, identificador))
    colaborador = cursor.fetchone()
    cursor.close()
    conn.close()

    # Conta criada, mas a senha ainda não foi definida pelo link
    if colaborador and colaborador['ativo'] == 1 and colaborador['senha_hash'] is None:
        return jsonify({
            'msg': 'Você ainda não definiu sua senha. Use o link enviado no seu cadastro.',
            'success': False
        }), 403

    if (not colaborador
            or not colaborador['ativo']
            or not check_password_hash(colaborador['senha_hash'], senha)):
        return jsonify({'msg': 'Login ou senha incorretos.', 'success': False}), 401

    return jsonify({
        'msg': 'Login bem-sucedido!',
        'success': True,
        'id_colaborador': colaborador['id_colaborador'],
        'nome': colaborador['nome_completo'],
        'nivel_acesso': colaborador['nivel_acesso']
    })


@login_bp.route('/validar-token', methods=['GET'])
def validar_token():
    token = request.args.get('token', '')
    if not token:
        return jsonify({'valido': False})

    conn = database_connection.open_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    colaborador = buscar_colaborador_pelo_token(cursor, token)
    cursor.close()
    conn.close()

    return jsonify({'valido': colaborador is not None})


@login_bp.route('/definir-senha', methods=['POST'])
def definir_senha():
    data = request.get_json(silent=True) or {}

    token      = str(data.get('token', ''))
    nova_senha = str(data.get('senha', ''))

    if len(nova_senha) < TAMANHO_MINIMO_SENHA:
        return jsonify({
            'success': False,
            'msg': f'A senha deve ter pelo menos {TAMANHO_MINIMO_SENHA} caracteres.'
        }), 400

    conn = database_connection.open_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    colaborador = buscar_colaborador_pelo_token(cursor, token)
    if not colaborador:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'msg': 'Link inválido ou expirado.'}), 400

    # Grava a senha e invalida o token (uso único)
    SQL = """
        UPDATE colaboradores
        SET senha_hash = %s, token_ativacao_hash = NULL, token_expira_em = NULL
        WHERE id_colaborador = %s;
    """
    cursor.execute(SQL, (generate_password_hash(nova_senha), colaborador['id_colaborador']))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'success': True, 'msg': 'Senha definida com sucesso!'})
