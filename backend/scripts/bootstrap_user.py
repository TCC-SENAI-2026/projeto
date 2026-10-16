"""Lógica compartilhada dos scripts; nunca executada ao importar o backend.

Os dois comandos são de uso inicial, após a criação manual do banco. Não são
um cadastro público nem substituem o futuro CRUD de colaboradores (T04).
"""

import argparse
import getpass
import re
import secrets
import sys
import warnings
from pathlib import Path

# Permite executar `python backend/scripts/create_admin.py` da raiz do projeto.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask import Flask
from mysql.connector import Error as MySQLError
from werkzeug.security import generate_password_hash

from config import load_config
from database.connection import db_cursor, init_db


def read_password():
    """Interrompe se o terminal não puder ocultar a senha; nunca usa input()."""
    with warnings.catch_warnings():
        warnings.simplefilter('error', getpass.GetPassWarning)
        password = getpass.getpass('Senha inicial (mínimo de 8 caracteres): ')
        confirmation = getpass.getpass('Confirme a senha: ')
    if not 8 <= len(password) <= 1024 or password != confirmation:
        raise ValueError('Senha inválida ou confirmação diferente; nada foi criado.')
    return generate_password_hash(password)


def generate_available_re(cursor):
    """RE aprovado: quatro dígitos, inclusive zeros iniciais, guardado como texto."""
    for _ in range(100):
        candidate = f'{secrets.randbelow(10000):04d}'
        cursor.execute('SELECT id FROM colaboradores WHERE re = %s', (candidate,))
        if cursor.fetchone() is None:
            return candidate
    raise ValueError('Não foi possível gerar um RE livre; nada foi criado.')


def insert_initial_user(cursor, *, role, employee_re, name, email, password_hash):
    """Valida duplicações na transação; UNIQUE também protege RE/e-mail no banco."""
    cursor.execute('SELECT id FROM colaboradores WHERE nivel_acesso = %s LIMIT 1', (role,))
    if cursor.fetchone() is not None:
        raise ValueError('Já existe uma conta deste perfil; este script inicial não pode ser repetido.')
    cursor.execute('SELECT id FROM colaboradores WHERE email = %s', (email,))
    if cursor.fetchone() is not None:
        raise ValueError('E-mail já cadastrado; nada foi criado.')
    if employee_re is None:
        employee_re = generate_available_re(cursor)
    else:
        cursor.execute('SELECT id FROM colaboradores WHERE re = %s', (employee_re,))
        if cursor.fetchone() is not None:
            raise ValueError('RE já cadastrado; nada foi criado.')

    cursor.execute(
        '''INSERT INTO colaboradores
           (re, nome, email, nivel_acesso, senha_hash, ativo, conta_ativada)
           VALUES (%s, %s, %s, %s, %s, 1, 1)''',
        (employee_re, name, email, role, password_hash),
    )
    return employee_re


def main(role):
    """Só abre a conexão depois da confirmação local e das entradas válidas."""
    argparse.ArgumentParser(
        description=f'Cria um único {role} inicial. Execute somente após confirmar a etapa B.'
    ).parse_args()
    if not sys.stdin.isatty():
        print('Use um terminal interativo para manter a senha oculta.', file=sys.stderr)
        return 1

    try:
        if input('Após a confirmação da etapa B, digite BANCO CRIADO para continuar: ').strip() != 'BANCO CRIADO':
            print('Cancelado; nenhuma conexão ou conta foi criada.')
            return 1
        name = input('Nome: ').strip()
        email = input('E-mail (não será usado para login nem envio nesta etapa): ').strip()
        if not name or len(name) > 150:
            raise ValueError('Informe um nome de até 150 caracteres.')
        if len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
            raise ValueError('Informe um e-mail válido de até 254 caracteres.')
        employee_re = input(f'RE do {role} (4 dígitos): ').strip()
        if not re.fullmatch(r'[0-9]{4}', employee_re):
            raise ValueError('O RE deve conter exatamente 4 dígitos.')
        password_hash = read_password()

        # Aplicação mínima: não importa módulos de negócio nem envia e-mails.
        app = Flask(__name__)
        app.config.update(load_config())
        init_db(app)
        with app.app_context(), db_cursor(commit=True) as cursor:
            # O lock serializa os dois scripts, evitando duas contas iniciais
            # do mesmo perfil quando comandos são abertos simultaneamente.
            cursor.execute('SELECT GET_LOCK(%s, 10) AS acquired', ('ethreads_bootstrap',))
            if cursor.fetchone()['acquired'] != 1:
                raise ValueError('Outro script está em execução; tente novamente.')
            # O pool limpa a sessão MySQL no close(), liberando o lock após
            # commit/rollback. Ele permanece mantido até o fim da transação.
            employee_re = insert_initial_user(
                cursor, role=role, employee_re=employee_re, name=name,
                email=email, password_hash=password_hash,
            )
        print(f'Conta {role} criada. RE para login: {employee_re}')
        return 0
    except (EOFError, KeyboardInterrupt):
        print('\nCancelado; nenhuma criação foi confirmada.', file=sys.stderr)
    except (ValueError, getpass.GetPassWarning) as error:
        print(str(error), file=sys.stderr)
    except MySQLError:
        print('Falha no banco ou duplicação. Verifique o .env e o schema local; nenhum segredo foi exibido.', file=sys.stderr)
    return 1
