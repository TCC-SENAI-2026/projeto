"""Autorização baseada no estado atual da conta, consultado a cada request."""

from functools import wraps

from flask import g, jsonify, session
from mysql.connector import Error as DatabaseError

from database.connection import db_cursor


ALLOWED_ROLES = frozenset({"administrador", "colaborador"})


def public_collaborator(collaborator):
    """Lista explícita: nenhum hash, CPF ou dado pessoal extra chega à SPA."""
    return {key: collaborator[key] for key in ("id", "re", "nome", "nivel_acesso")}


def _require_collaborator():
    """Carrega a conta uma vez por request; nunca reutiliza perfil do cookie."""
    if getattr(g, "colaborador", None) is not None:
        return None

    collaborator_id = session.get("colaborador_id")
    if collaborator_id is None:
        # A sessão anônima pode guardar o token usado no próximo login.
        return jsonify({"success": False, "msg": "Autenticação necessária."}), 401
    if type(collaborator_id) is not int or collaborator_id <= 0:
        session.clear()
        return jsonify({"success": False, "msg": "Autenticação necessária."}), 401

    try:
        with db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, re, nome, nivel_acesso, senha_hash, ativo, conta_ativada
                FROM colaboradores WHERE id = %s
                """,
                (collaborator_id,),
            )
            collaborator = cursor.fetchone()
    except (DatabaseError, RuntimeError):
        return jsonify({"success": False, "msg": "Serviço indisponível. Tente novamente."}), 503

    if not collaborator:
        session.clear()
        return jsonify({"success": False, "msg": "Autenticação necessária."}), 401

    if (
        not collaborator.get("ativo")
        or not collaborator.get("conta_ativada")
        or not isinstance(collaborator.get("senha_hash"), str)
        or not collaborator.get("senha_hash")
        or collaborator.get("nivel_acesso") not in ALLOWED_ROLES
    ):
        session.clear()
        return jsonify({"success": False, "msg": "Conta sem permissão de acesso."}), 403

    # g tem duração de uma requisição. Desativar/rebaixar a conta no banco afeta
    # a próxima chamada protegida mesmo que o cookie ainda não tenha expirado.
    g.colaborador = collaborator
    return None


def login_required(view):
    """Exige uma conta existente, ativa e ativada, com um perfil conhecido."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        error = _require_collaborator()
        if error is not None:
            return error
        return view(*args, **kwargs)

    return wrapped


def admin_required(view):
    """Além da sessão válida, exige o perfil administrativo atual no banco."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        error = _require_collaborator()
        if error is not None:
            return error
        if g.colaborador["nivel_acesso"] != "administrador":
            return jsonify({"success": False, "msg": "Acesso negado."}), 403
        return view(*args, **kwargs)

    return wrapped
