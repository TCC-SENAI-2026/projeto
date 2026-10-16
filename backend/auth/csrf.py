"""Token CSRF associado à sessão, inclusive antes da autenticação.

Fluxo: GET /csrf → cookie + token → POST /login com X-CSRF-Token → novo
cookie + novo token. A SPA envia o token atual em toda requisição de escrita.
"""

import secrets

from flask import jsonify, request, session


CSRF_SESSION_KEY = "csrf_token"
UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def get_csrf_token():
    """Reutiliza o token da sessão; gera um token aleatório quando necessário."""
    token = session.get(CSRF_SESSION_KEY)
    if not isinstance(token, str) or not token:
        token = secrets.token_urlsafe(32)
        session[CSRF_SESSION_KEY] = token
    return token


def init_csrf(app):
    """Instala a verificação global antes de qualquer lógica de negócio."""

    @app.before_request
    def validate_csrf():
        if request.method not in UNSAFE_METHODS:
            return None

        # Não gera token aqui: uma escrita inválida não deve criar sessão nem
        # receber implicitamente o token de que precisava para ser autorizada.
        expected = session.get(CSRF_SESSION_KEY)
        received = request.headers.get("X-CSRF-Token", "")
        if (
            not isinstance(expected, str)
            or not expected
            or not received
            or not secrets.compare_digest(expected.encode("utf-8"), received.encode("utf-8"))
        ):
            return jsonify({"success": False, "msg": "Token CSRF ausente ou inválido."}), 403
        return None
