"""Redefinição por RE e link de uso único (T05), sem aprovação administrativa."""

from flask import Blueprint, current_app, jsonify, request
from werkzeug.security import generate_password_hash

from database.connection import db_cursor
from resources import email_service, seguranca

senha_bp = Blueprint('senha', __name__)
CONFIRMACAO = 'Se o RE corresponder a uma conta ativa, enviaremos um link ao e-mail cadastrado.'


@senha_bp.after_request
def impedir_cache_senha(resposta):
    resposta.headers['Cache-Control'] = 'no-store'
    return resposta



@senha_bp.get('/validar-token')
def validar_token_ativacao():
    token = request.args.get('token', '')
    if not token or len(token) > 256:
        return jsonify(valido=False)
    with db_cursor() as cursor:
        cursor.execute('''SELECT c.re FROM tokens t
            JOIN colaboradores c ON c.id = t.colaborador_id
            WHERE t.token_hash = %s AND t.tipo = 'ativacao'
            AND t.usado_em IS NULL AND t.expira_em > NOW()
            AND c.ativo = 1 AND c.conta_ativada = 0''', (seguranca.hash_token(token),))
        colaborador = cursor.fetchone()
    if not colaborador:
        return jsonify(valido=False)
    return jsonify(valido=True, re=colaborador['re'])


@senha_bp.post('/definir-senha')
def definir_senha():
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return jsonify(success=False, msg='Envie um objeto JSON válido.'), 400
    token, senha = dados.get('token'), dados.get('senha')
    if not isinstance(token, str) or not token or len(token) > 256:
        return jsonify(success=False, msg='Link inválido ou expirado.'), 400
    if not isinstance(senha, str) or not 8 <= len(senha) <= 1024:
        return jsonify(success=False, msg='A senha deve ter entre 8 e 1024 caracteres.'), 400
    with db_cursor(commit=True) as cursor:
        cursor.execute('''SELECT c.id FROM colaboradores c JOIN tokens t ON t.colaborador_id = c.id
            WHERE t.token_hash = %s AND t.tipo = 'ativacao'
            AND c.ativo = 1 AND c.conta_ativada = 0 FOR UPDATE''', (seguranca.hash_token(token),))
        colaborador = cursor.fetchone()
        if not colaborador:
            return jsonify(success=False, msg='Link inválido ou expirado.'), 400
        cursor.execute('''SELECT id FROM tokens WHERE token_hash = %s AND tipo = 'ativacao'
            AND usado_em IS NULL AND expira_em > NOW() FOR UPDATE''', (seguranca.hash_token(token),))
        if not cursor.fetchone():
            return jsonify(success=False, msg='Link inválido ou expirado.'), 400
        cursor.execute('UPDATE colaboradores SET senha_hash = %s, conta_ativada = 1 WHERE id = %s',
                       (generate_password_hash(senha), colaborador['id']))
        cursor.execute('''UPDATE tokens SET usado_em = NOW() WHERE colaborador_id = %s
            AND tipo = 'ativacao' AND usado_em IS NULL''', (colaborador['id'],))
    return jsonify(success=True, msg='Senha definida! Entre com seu RE e a nova senha.')


@senha_bp.post('/solicitar-redefinicao')
def solicitar_redefinicao():
    dados = request.get_json(silent=True)
    re = dados.get('re') if isinstance(dados, dict) else None
    if not isinstance(re, str) or not re.strip() or len(re.strip()) > 20:
        return jsonify(success=False, msg='Informe um RE válido (até 20 caracteres).'), 400

    with db_cursor(commit=True) as cursor:
        # Serializa solicitações da mesma conta e evita links concorrentes.
        cursor.execute('''SELECT id, nome, email FROM colaboradores
            WHERE re = %s AND ativo = 1 AND conta_ativada = 1 FOR UPDATE''', (re.strip(),))
        colaborador = cursor.fetchone()
        if not colaborador:
            return jsonify(success=True, msg=CONFIRMACAO)
        token = seguranca.gerar_token()
        cursor.execute('''UPDATE tokens SET expira_em = NOW()
            WHERE colaborador_id = %s AND tipo = 'redefinicao'
            AND usado_em IS NULL AND expira_em > NOW()''', (colaborador['id'],))
        cursor.execute('''INSERT INTO tokens (colaborador_id, tipo, token_hash, expira_em)
            VALUES (%s, 'redefinicao', %s, DATE_ADD(NOW(), INTERVAL 24 HOUR))''',
            (colaborador['id'], seguranca.hash_token(token)))
    try:
        email_service.enviar_link_redefinicao(colaborador['nome'], colaborador['email'], token)
    except Exception:
        # Não expõe destinatários, credenciais ou existência da conta.
        current_app.logger.warning('Não foi possível enviar o e-mail de redefinição.')
    return jsonify(success=True, msg=CONFIRMACAO)


@senha_bp.post('/redefinir-senha')
def redefinir_senha():
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return jsonify(success=False, msg='Envie um objeto JSON válido.'), 400
    token, senha = dados.get('token'), dados.get('senha')
    if not isinstance(token, str) or not token or len(token) > 256:
        return jsonify(success=False, msg='Link inválido ou expirado. Solicite outro no login.'), 400
    if not isinstance(senha, str) or not 8 <= len(senha) <= 1024:
        return jsonify(success=False, msg='A senha deve ter entre 8 e 1024 caracteres.'), 400

    with db_cursor(commit=True) as cursor:
        # Mesma ordem de bloqueio da solicitação: conta antes dos tokens.
        cursor.execute('''SELECT c.id FROM colaboradores c JOIN tokens t ON t.colaborador_id = c.id
            WHERE t.token_hash = %s AND t.tipo = 'redefinicao'
            AND c.ativo = 1 AND c.conta_ativada = 1 FOR UPDATE''', (seguranca.hash_token(token),))
        colaborador = cursor.fetchone()
        if not colaborador:
            return jsonify(success=False, msg='Link inválido ou expirado. Solicite outro no login.'), 400
        cursor.execute('''SELECT id FROM tokens WHERE token_hash = %s AND tipo = 'redefinicao'
            AND usado_em IS NULL AND expira_em > NOW() FOR UPDATE''', (seguranca.hash_token(token),))
        if not cursor.fetchone():
            return jsonify(success=False, msg='Link inválido ou expirado. Solicite outro no login.'), 400
        cursor.execute('UPDATE colaboradores SET senha_hash = %s WHERE id = %s',
                       (generate_password_hash(senha), colaborador['id']))
        cursor.execute('''UPDATE tokens SET usado_em = NOW() WHERE colaborador_id = %s
            AND tipo = 'redefinicao' AND usado_em IS NULL''', (colaborador['id'],))
    return jsonify(success=True, msg='Senha redefinida! Entre com seu RE e a nova senha.')
