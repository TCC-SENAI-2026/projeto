import hashlib
import secrets


def gerar_token():
    """Token aleatório que vai no link enviado ao colaborador."""
    return secrets.token_urlsafe(32)


def hash_token(token):
    """No banco guardamos só o hash do token, nunca o token em si."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()
