"""T05: Flask real, banco e SMTP simulados explicitamente."""
from contextlib import contextmanager
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from flask import Flask
from werkzeug.security import check_password_hash, generate_password_hash
from auth.csrf import init_csrf
from login import login_bp
from senha import senha_bp
from resources.seguranca import hash_token


class RedefinicaoTests(unittest.TestCase):
    def setUp(self):
        self.conta = dict(id=1, re='1234', nome='Pessoa Teste', email='teste@example.com',
                          ativo=1, conta_ativada=1, nivel_acesso='colaborador',
                          senha_hash=generate_password_hash('Senha antiga'))
        self.tokens = {}
        self.atual = None
        self.app = Flask(__name__)
        self.app.config.update(TESTING=True, SECRET_KEY='teste-isolado')
        init_csrf(self.app)
        self.app.register_blueprint(login_bp)
        self.app.register_blueprint(senha_bp)

        @contextmanager
        def banco(**kwargs):
            cursor = Mock()

            def execute(sql, params):
                sql = ' '.join(sql.split())
                resultado = None
                elegivel = self.conta['ativo'] and self.conta['conta_ativada']
                if sql.startswith('SELECT'):
                    if 'JOIN tokens' in sql:
                        resultado = self.conta if params[0] in self.tokens and elegivel else None
                    elif 'FROM tokens' in sql:
                        resultado = {'id': 1} if self.tokens.get(params[0]) == 'valido' else None
                    else:
                        resultado = self.conta if params[0] == self.conta['re'] else None
                        if 'FOR UPDATE' in sql and not elegivel:
                            resultado = None
                elif sql.startswith('INSERT INTO tokens'):
                    self.tokens[params[1]] = 'valido'
                elif 'UPDATE colaboradores' in sql:
                    self.conta['senha_hash'] = params[0]
                elif 'UPDATE tokens' in sql:
                    for token in self.tokens:
                        self.tokens[token] = 'usado' if 'usado_em = NOW()' in sql else 'expirado'
                cursor.fetchone.return_value = resultado

            cursor.execute.side_effect = execute
            yield cursor

        self.enterContext(patch('senha.db_cursor', side_effect=banco))
        self.enterContext(patch('login.db_cursor', side_effect=banco))
        self.email = self.enterContext(patch('senha.email_service.enviar_link_redefinicao'))
        self.client = self.app.test_client()
        self.csrf = self.client.get('/csrf').json['csrf_token']

    def post(self, path, dados):
        return self.client.post(path, json=dados, headers={'X-CSRF-Token': self.csrf})

    def solicitar(self):
        resposta = self.post('/solicitar-redefinicao', {'re': '1234'})
        self.assertEqual(resposta.status_code, 200)
        return self.email.call_args.args[2]

    def trocar(self, token, senha='Nova senha segura'):
        return self.post('/redefinir-senha', dict(token=token, senha=senha))

    def test_fluxo_completo_login_e_uso_unico(self):
        token = self.solicitar()
        self.assertIn(hash_token(token), self.tokens)
        self.assertNotIn(token, self.tokens)
        self.email.assert_called_once_with('Pessoa Teste', 'teste@example.com', token)
        self.assertEqual(self.trocar(token).status_code, 200)
        self.assertTrue(check_password_hash(self.conta['senha_hash'], 'Nova senha segura'))
        self.assertEqual(self.trocar(token).status_code, 400)
        self.assertEqual(self.post('/login', {'re': '1234', 'senha': 'Senha antiga'}).status_code, 401)
        self.assertEqual(self.post('/login', {'re': '1234', 'senha': 'Nova senha segura'}).status_code, 200)

    def test_resposta_generica_e_contas_bloqueadas(self):
        esperado = self.post('/solicitar-redefinicao', {'re': '1234'}).json
        self.email.reset_mock()
        self.assertEqual(self.post('/solicitar-redefinicao', {'re': 'ausente'}).json, esperado)
        for campo in ('ativo', 'conta_ativada'):
            self.conta[campo] = 0
            self.assertEqual(self.post('/solicitar-redefinicao', {'re': '1234'}).json, esperado)
            self.conta[campo] = 1
        self.email.assert_not_called()

    def test_novo_envio_expiracao_e_token_de_outro_tipo(self):
        antigo = self.solicitar()
        novo = self.solicitar()
        self.assertEqual(self.trocar(antigo).status_code, 400)
        self.tokens[hash_token(novo)] = 'expirado'
        self.assertEqual(self.trocar(novo).status_code, 400)
        self.assertEqual(self.trocar('token-de-ativacao').status_code, 400)

    def test_conta_desativada_depois_do_envio(self):
        token = self.solicitar()
        self.conta['ativo'] = 0
        self.assertEqual(self.trocar(token).status_code, 400)

    def test_validacao_e_csrf(self):
        for dados in ([], {}, {'re': 123}, {'re': 'x' * 21}):
            self.assertEqual(self.post('/solicitar-redefinicao', dados).status_code, 400)
        token = self.solicitar()
        for senha in ('curta', None, 'x' * 1025):
            self.assertEqual(self.trocar(token, senha).status_code, 400)
        for rota in ('/solicitar-redefinicao', '/redefinir-senha'):
            self.assertEqual(self.client.post(rota, json={}).status_code, 403)

    def test_falha_smtp_nao_revela_conta(self):
        self.email.side_effect = RuntimeError('segredo smtp')
        resposta = self.post('/solicitar-redefinicao', {'re': '1234'})
        self.assertEqual(resposta.status_code, 200)
        self.assertNotIn('segredo', resposta.get_data(as_text=True))
