"""Ações administrativas diretas e solicitações comuns, com banco simulado."""
from contextlib import contextmanager
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from auth.csrf import init_csrf
from solicitacoes import solicitacoes_bp
from clientes import clientes_bp
from estoque import estoque_bp


class TestAcoesAdministrador(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.config.update(TESTING=True, SECRET_KEY='teste-acoes')
        init_csrf(app)
        for blueprint in (solicitacoes_bp, clientes_bp, estoque_bp):
            app.register_blueprint(blueprint)
        self.client = app.test_client()
        self.headers = {'X-CSRF-Token': 'teste-csrf'}
        with self.client.session_transaction() as sessao:
            sessao.update(colaborador_id=1, csrf_token='teste-csrf')
        self.usuario = dict(id=1, nome='Teste', re='001', ativo=1,
                            conta_ativada=1, senha_hash='teste-hash', nivel_acesso='administrador')
        auth = Mock()
        auth.fetchone.side_effect = lambda: self.usuario
        self.cursor = Mock()
        self.cursor.lastrowid = 12

        @contextmanager
        def auth_cursor():
            yield auth

        @contextmanager
        def cursor(**kwargs):
            yield self.cursor

        self.enterContext(patch('auth.decorators.db_cursor', auth_cursor))
        self.enterContext(patch('solicitacoes.db_cursor', cursor))

    def consultas(self):
        return [c.args[0] for c in self.cursor.execute.call_args_list]

    def test_admin_inativa_reativa_sem_justificativa_ou_solicitacao(self):
        for alvo, tabela in (('cliente', 'clientes'), ('estoque', 'estoque')):
            for tipo, ativo in (('exclusao', 0), ('edicao', 1)):
                with self.subTest(alvo=alvo, tipo=tipo):
                    self.cursor.reset_mock()
                    self.cursor.fetchone.return_value = {'id': 2, 'nome': 'Registro'}
                    resposta = self.client.post('/solicitacoes', headers=self.headers,
                        json={'tipo': tipo, f'{alvo}_id': 2})
                    self.assertEqual(resposta.status_code, 200)
                    self.assertEqual(resposta.json['modo'], 'direto')
                    self.cursor.execute.assert_any_call(f'UPDATE {tabela} SET ativo = %s WHERE id = %s', (ativo, 2))
                    self.assertFalse(any('INSERT INTO solicitacoes' in sql for sql in self.consultas()))

    def test_colaborador_continua_enviando_solicitacao(self):
        self.usuario['nivel_acesso'] = 'colaborador'
        self.cursor.fetchone.side_effect = [{'id': 2, 'nome': 'Cliente'}, None]
        resposta = self.client.post('/solicitacoes', headers=self.headers,
            json={'tipo': 'exclusao', 'cliente_id': 2, 'justificativa': 'Cliente duplicado'})
        self.assertEqual(resposta.status_code, 201)
        self.assertTrue(any('INSERT INTO solicitacoes' in sql for sql in self.consultas()))
        self.assertFalse(any('UPDATE clientes' in sql for sql in self.consultas()))

    def test_colaborador_nao_burla_justificativa_enviando_perfil_no_payload(self):
        self.usuario['nivel_acesso'] = 'colaborador'
        resposta = self.client.post('/solicitacoes', headers=self.headers,
            json={'tipo': 'exclusao', 'cliente_id': 2, 'nivel_acesso': 'administrador'})
        self.assertEqual(resposta.status_code, 400)
        self.cursor.execute.assert_not_called()

    def test_admin_exclui_pedido_devolvendo_estoque_sem_solicitacao(self):
        self.cursor.fetchone.side_effect = [{'id': 2}, {'c': 1}]
        self.cursor.fetchall.return_value = [{'estoque_id': 4, 'nome_item': 'Peça', 'total': 3}]
        resposta = self.client.post('/solicitacoes', headers=self.headers,
            json={'tipo': 'exclusao', 'pedido_id': 2})
        self.assertEqual(resposta.status_code, 200)
        self.assertTrue(any('quantidade_atual = quantidade_atual +' in sql for sql in self.consultas()))
        self.assertTrue(any('UPDATE pedidos SET excluido_em' in sql for sql in self.consultas()))
        self.assertFalse(any('INSERT INTO solicitacoes' in sql for sql in self.consultas()))

    def test_csrf_continua_obrigatorio_para_admin(self):
        resposta = self.client.post('/solicitacoes', json={'tipo': 'exclusao', 'cliente_id': 2})
        self.assertEqual(resposta.status_code, 403)
        self.cursor.execute.assert_not_called()


if __name__ == '__main__':
    unittest.main()
