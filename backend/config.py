"""Configuração central: segredos locais ficam no .env, nunca no repositório."""

import os
import secrets
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv


def load_config():
    """Lê backend/.env sem substituir variáveis já definidas no ambiente."""
    load_dotenv(Path(__file__).with_name('.env'), override=False)
    production = os.getenv('APP_ENV', 'development').lower() == 'production'
    secret_key = os.getenv('SECRET_KEY', '')
    if production and len(secret_key) < 32:
        raise ValueError('Em produção, configure SECRET_KEY com pelo menos 32 caracteres.')

    return {
        # Sem .env o desenvolvimento inicia com chave aleatória por processo.
        # Uma chave local persistente mantém a sessão após reiniciar o Flask.
        'SECRET_KEY': secret_key or secrets.token_hex(32),
        'SESSION_COOKIE_HTTPONLY': True,
        'SESSION_COOKIE_SAMESITE': 'Lax',
        'SESSION_COOKIE_SECURE': production,
        'PERMANENT_SESSION_LIFETIME': timedelta(hours=8),
        'SESSION_REFRESH_EACH_REQUEST': False,
        'FRONTEND_ORIGIN': os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173'),
        'DB_HOST': os.getenv('DB_HOST', 'localhost'),
        'DB_PORT': int(os.getenv('DB_PORT', '3306')),
        'DB_USER': os.getenv('DB_USER', ''),
        'DB_PASSWORD': os.getenv('DB_PASSWORD'),
        'DB_NAME': os.getenv('DB_NAME', 'ethreads_db'),
        'DB_POOL_SIZE': int(os.getenv('DB_POOL_SIZE', '5')),
        'DB_CONNECT_TIMEOUT': int(os.getenv('DB_CONNECT_TIMEOUT', '5')),
        # Reservados para os módulos da equipe; nenhum envio nesta etapa.
        'SMTP_HOST': os.getenv('SMTP_HOST', ''),
        'SMTP_PORT': int(os.getenv('SMTP_PORT', '587')),
        'SMTP_USER': os.getenv('SMTP_USER', ''),
        'SMTP_PASSWORD': os.getenv('SMTP_PASSWORD', ''),
        'SMTP_FROM': os.getenv('SMTP_FROM', ''),
    }
