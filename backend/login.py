"""Login por RE, consulta da sessão e logout (T03).

O navegador recebe somente um cookie de sessão assinado pelo Flask. A senha e
seu hash nunca entram no cookie ou na resposta. Ativação e recuperação de senha
pertencem às próximas tarefas e não são expostas por este blueprint.
"""

from flask import Blueprint, g, jsonify, request, session
from mysql.connector import Error as DatabaseError
from werkzeug.security import check_password_hash

from auth.csrf import get_csrf_token
from auth.decorators import ALLOWED_ROLES, login_required, public_collaborator
from database.connection import db_cursor


login_bp = Blueprint("login", __name__)


@login_bp.after_request
def prevent_auth_cache(response):
    """Evita que dados da sessão e tokens fiquem no cache do navegador."""
    response.headers["Cache-Control"] = "no-store"
    return response


@login_bp.get("/csrf")
def csrf():
    """Inicia a sessão anônima, antes do POST de login protegido por CSRF."""
    return jsonify({"csrf_token": get_csrf_token()})


@login_bp.post("/login")
def login():
    """Valida RE + senha e troca a sessão anônima por uma sessão autenticada."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "msg": "Envie um objeto JSON válido."}), 400

    re_value, password = data.get("re"), data.get("senha")
    if not isinstance(re_value, str) or not isinstance(password, str):
        return jsonify({"success": False, "msg": "Informe RE e senha válidos."}), 400

    re_value = re_value.strip()
    # Os scripts iniciais usam os quatro dígitos aprovados. O login consulta
    # o identificador como texto; VARCHAR(20) continua sendo o limite do schema.
    if not re_value or len(re_value) > 20 or "@" in re_value or not password:
        return jsonify({"success": False, "msg": "RE ou senha incorretos."}), 401
    if len(password) > 1024:
        return jsonify({"success": False, "msg": "Informe RE e senha válidos."}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, re, nome, nivel_acesso, senha_hash, ativo, conta_ativada
                FROM colaboradores WHERE re = %s
                """,
                (re_value,),
            )
            collaborator = cursor.fetchone()
    except (DatabaseError, RuntimeError):
        # A mensagem não revela SQL, configuração da conexão ou credenciais.
        return jsonify({"success": False, "msg": "Serviço indisponível. Tente novamente."}), 503

    if not collaborator:
        return jsonify({"success": False, "msg": "RE ou senha incorretos."}), 401

    password_hash = collaborator.get("senha_hash")
    if (
        not collaborator.get("ativo")
        or not collaborator.get("conta_ativada")
        or not isinstance(password_hash, str)
        or not password_hash
        or collaborator.get("nivel_acesso") not in ALLOWED_ROLES
    ):
        return jsonify({"success": False, "msg": "Conta sem permissão de acesso."}), 403

    try:
        valid_password = check_password_hash(password_hash, password)
    except (ValueError, TypeError):
        valid_password = False
    if not valid_password:
        return jsonify({"success": False, "msg": "RE ou senha incorretos."}), 401

    # Descarta dados da sessão anterior e também o token anônimo. O perfil é
    # sempre consultado no banco, nunca confiado ao conteúdo do cookie.
    session.clear()
    session["colaborador_id"] = collaborator["id"]
    return jsonify(
        {
            "success": True,
            "csrf_token": get_csrf_token(),
            "colaborador": public_collaborator(collaborator),
        }
    )


@login_bp.get("/me")
@login_required
def me():
    """Retorna o perfil atual do banco e o token para a SPA após um refresh."""
    return jsonify({**public_collaborator(g.colaborador), "csrf_token": get_csrf_token()})


@login_bp.post("/logout")
def logout():
    """O before_request valida CSRF; limpar a sessão expira seu cookie."""
    session.clear()
    return jsonify({"success": True})
