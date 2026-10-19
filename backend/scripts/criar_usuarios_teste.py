"""Fase 03: cria os dois usuarios padrao de desenvolvimento, sem interacao.

Diferente de bootstrap_user.py (interativo e nao idempotente), este script foi
feito para a equipe rodar quantas vezes precisar: cria o que falta e nao mexe
no que ja existe. Nao sobrescreve senhas nem altera contas reais. Executa so
quando chamado explicitamente da linha de comando.

Uso:
    python backend/scripts/criar_usuarios_teste.py

Codigos de saida:
    0 - Sucesso (ambos CREATED ou SKIP).
    1 - Erro de configuracao/conexao com o MySQL.
    2 - Conflito: RE ja existe com dados diferentes dos esperados.
"""

import sys
from pathlib import Path

# Permite rodar da raiz do projeto sem precisar ajustar PYTHONPATH.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask import Flask
from mysql.connector import Error as MySQLError
from werkzeug.security import generate_password_hash

from config import load_config
from database.connection import db_cursor, init_db


# Credenciais aprovadas (D2) - exclusivas para ambiente local de desenvolvimento.
# NUNCA usar essas senhas em producao. Documentado em CREDENCIAIS_TESTE.md.
USUARIOS_PADRAO = (
    {
        "re": "0123",
        "nome": "Administrador Teste",
        "email": "admin.teste@ethreads.local",
        "nivel_acesso": "administrador",
        "senha_bruta": "12345678",
    },
    {
        "re": "0234",
        "nome": "Colaborador Teste",
        "email": "colab.teste@ethreads.local",
        "nivel_acesso": "colaborador",
        "senha_bruta": "12345678",
    },
)


def _processar_usuario(cursor, usuario):
    """Decide entre criar, pular ou sinalizar conflito; nunca sobrescreve."""
    cursor.execute(
        "SELECT id, nome, nivel_acesso, email FROM colaboradores WHERE re = %s",
        (usuario["re"],),
    )
    atual = cursor.fetchone()

    if atual is None:
        senha_hash = generate_password_hash(usuario["senha_bruta"])
        cursor.execute(
            """
            INSERT INTO colaboradores
                (re, nome, email, nivel_acesso, senha_hash, ativo, conta_ativada)
            VALUES (%s, %s, %s, %s, %s, 1, 1)
            """,
            (
                usuario["re"],
                usuario["nome"],
                usuario["email"],
                usuario["nivel_acesso"],
                senha_hash,
            ),
        )
        print(f"CREATED: {usuario['re']} ({usuario['nivel_acesso']})")
        return "created"

    coincide = (
        atual["nome"] == usuario["nome"]
        and atual["nivel_acesso"] == usuario["nivel_acesso"]
        and atual["email"] == usuario["email"]
    )
    if coincide:
        print(f"SKIP: {usuario['re']} ja existe com os mesmos dados")
        return "skipped"

    print(
        f"CONFLICT: {usuario['re']} ja existe com dados diferentes "
        f"(nome='{atual['nome']}', nivel_acesso='{atual['nivel_acesso']}'). "
        f"Nenhuma alteracao feita; resolva manualmente antes de continuar."
    )
    return "conflict"


def main():
    app = Flask(__name__)
    app.config.update(load_config())
    init_db(app)

    try:
        with app.app_context(), db_cursor(commit=True) as cursor:
            # Serializa execucoes paralelas em maquinas diferentes contra
            # o mesmo banco. Nao impede acesso simultaneo das demais rotas.
            cursor.execute(
                "SELECT GET_LOCK(%s, 10) AS acquired", ("ethreads_seed_dev",)
            )
            if cursor.fetchone()["acquired"] != 1:
                print(
                    "Outro script esta rodando no mesmo banco; tente novamente.",
                    file=sys.stderr,
                )
                return 1

            houve_conflito = False
            for usuario in USUARIOS_PADRAO:
                resultado = _processar_usuario(cursor, usuario)
                if resultado == "conflict":
                    houve_conflito = True

        if houve_conflito:
            # commit mantem o que foi criado antes do conflito, se houver;
            # nada do registro conflitante foi tocado. Codigo 2 pede atencao
            # humana sem derrubar o fluxo da equipe.
            return 2
        return 0
    except MySQLError:
        # Sem detalhes do driver na saida: evita vazar host/usuario/schema.
        print(
            "Falha ao conectar ou executar no MySQL. "
            "Verifique backend/.env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) "
            "e se o schema foi aplicado.",
            file=sys.stderr,
        )
        return 1
    except RuntimeError as erro:
        # init_db exige DB_USER/DB_PASSWORD; mensagem especifica ajuda o setup.
        print(str(erro), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
