"""Primeiro acesso: Flask e SQL reais sobre SQLite em memória, sem SMTP/MySQL."""
from contextlib import contextmanager
from pathlib import Path
import sqlite3
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from flask import Flask
from auth.csrf import init_csrf
from login import login_bp
from senha import senha_bp
from resources.seguranca import hash_token


class AtivacaoSenhaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.addCleanup(self.db.close)
        self.db.row_factory = sqlite3.Row
        self.db.executescript('''
            CREATE TABLE colaboradores (id INTEGER PRIMARY KEY, re TEXT, nome TEXT,
                nivel_acesso TEXT, ativo INTEGER, conta_ativada INTEGER, senha_hash TEXT);
            CREATE TABLE tokens (id INTEGER PRIMARY KEY, colaborador_id INTEGER,
                tipo TEXT, token_hash TEXT, expira_em TEXT, usado_em TEXT);
            INSERT INTO colaboradores VALUES (1, '1234', 'Teste', 'colaborador', 1, 0, NULL);
        ''')
        self.token = 'token-ativacao-exclusivo-fixture'
        self.db.execute("INSERT INTO tokens VALUES (1, 1, 'ativacao', ?, '2099-01-01', NULL)", (hash_token(self.token),))
        self.db.commit()

        @contextmanager
        def banco(commit=False):
            db = self.db

            class Cursor:
                def execute(self, sql, params):
                    self.resultado = db.execute(sql.replace('%s', '?').replace('NOW()', 'CURRENT_TIMESTAMP').replace('FOR UPDATE', ''), params)

                def fetchone(self):
                    row = self.resultado.fetchone()
                    return dict(row) if row else None

            try:
                yield Cursor()
                if commit:
                    db.commit()
            except Exception:
                db.rollback()
                raise

        self.enterContext(patch('senha.db_cursor', side_effect=banco))
        self.enterContext(patch('login.db_cursor', side_effect=banco))
        app = Flask(__name__)
        app.config.update(TESTING=True, SECRET_KEY='fixture')
        init_csrf(app)
        app.register_blueprint(login_bp)
        app.register_blueprint(senha_bp)
        self.client = app.test_client()
        self.csrf = self.client.get('/csrf').json['csrf_token']

    def validar(self):
        return self.client.get('/validar-token', query_string={'token': self.token})

    def salvar(self, senha='Senha segura de teste'):
        return self.client.post('/definir-senha', json={'token': self.token, 'senha': senha},
                                headers={'X-CSRF-Token': self.csrf})

    def test_rotas_de_senha_nao_guardam_respostas_em_cache(self):
        self.assertEqual(self.validar().headers.get('Cache-Control'), 'no-store')
        self.assertEqual(self.salvar().headers.get('Cache-Control'), 'no-store')

    def test_ativar_outro_colaborador_nao_autentica_automaticamente_e_logout_limpa_admin(self):
        with self.client.session_transaction() as sessao:
            sessao['colaborador_id'] = 77
        self.assertEqual(self.salvar().status_code, 200)
        with self.client.session_transaction() as sessao:
            self.assertEqual(sessao['colaborador_id'], 77)
        resposta = self.client.post('/logout', headers={'X-CSRF-Token': self.csrf})
        self.assertEqual(resposta.status_code, 200)
        with self.client.session_transaction() as sessao:
            self.assertNotIn('colaborador_id', sessao)

    def test_ativacao_login_e_uso_unico(self):
        self.assertTrue(self.validar().json['valido'])
        self.assertEqual(self.salvar().status_code, 200)
        self.assertFalse(self.validar().json['valido'])
        self.assertEqual(self.salvar().status_code, 400)
        resposta = self.client.post('/login', json={'re': '1234', 'senha': 'Senha segura de teste'},
                                    headers={'X-CSRF-Token': self.csrf})
        self.assertEqual(resposta.status_code, 200)

    def test_expirado_usado_tipo_errado_conta_inativa_e_ja_ativada(self):
        for sql in ("UPDATE tokens SET expira_em = '2000-01-01'",
                    "UPDATE tokens SET usado_em = '2020-01-01'",
                    "UPDATE tokens SET tipo = 'redefinicao'",
                    'UPDATE colaboradores SET ativo = 0',
                    'UPDATE colaboradores SET conta_ativada = 1'):
            with self.subTest(sql=sql):
                self.db.execute('SAVEPOINT caso')
                self.db.execute(sql)
                self.assertFalse(self.validar().json['valido'])
                # A rota confirma transações mesmo para rejeições; restaurar os dados abaixo.
                self.assertEqual(self.salvar().status_code, 400)
                self.db.execute("UPDATE tokens SET expira_em = '2099-01-01', usado_em = NULL, tipo = 'ativacao'")
                self.db.execute('UPDATE colaboradores SET ativo = 1, conta_ativada = 0')
                self.db.commit()

    def test_validacao_csrf_e_token_desconhecido(self):
        self.assertEqual(self.client.post('/definir-senha', json={}).status_code, 403)
        self.assertEqual(self.salvar('curta').status_code, 400)
        self.assertEqual(self.salvar(None).status_code, 400)
        self.token = 'desconhecido'
        self.assertFalse(self.validar().json['valido'])
        self.assertEqual(self.salvar().status_code, 400)
