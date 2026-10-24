"""Regressões de integridade do merge; banco e contas são simulados."""

from contextlib import contextmanager
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from auth.csrf import init_csrf
from pedidos import pedidos_bp
from solicitacoes import solicitacoes_bp


class TestIntegracaoPedidos(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.config.update(TESTING=True, SECRET_KEY='fixture-merge-isolado')
        init_csrf(app)
        app.register_blueprint(pedidos_bp)
        app.register_blueprint(solicitacoes_bp)
        self.client = app.test_client()
        self.headers = {'X-CSRF-Token': 'fixture-csrf'}
        with self.client.session_transaction() as session:
            session.update(colaborador_id=1, csrf_token='fixture-csrf')
        auth = Mock()
        auth.fetchone.return_value = dict(
            id=1, re='0001', nome='Fixture', nivel_acesso='administrador',
            senha_hash='fixture-hash', ativo=1, conta_ativada=1,
        )

        @contextmanager
        def auth_cursor():
            yield auth

        self.enterContext(patch('auth.decorators.db_cursor', auth_cursor))
        self.conn = Mock()
        self.cursor = self.conn.cursor.return_value
        self.open_pedidos = self.enterContext(patch('pedidos.open_connection', return_value=self.conn))
        self.open_solicitacoes = self.enterContext(patch('solicitacoes.open_connection', return_value=self.conn))

    def test_edicao_rejeita_item_de_outro_pedido_antes_de_alterar_grade(self):
        self.cursor.fetchone.return_value = {'id': 1, 'cliente_id': 1, 'status': 'pendente'}
        self.cursor.fetchall.return_value = [{'id': 2}]
        response = self.client.put('/pedidos/1', headers=self.headers, json={
            'pedido': {'produtos': [{'item': 'Camiseta', 'detalhes': {'id': 999}, 'grade': {'M': 5}}]},
        })
        self.assertEqual(response.status_code, 400)
        sql = [c.args[0].strip().upper() for c in self.cursor.execute.call_args_list]
        self.assertTrue(all(q.startswith('SELECT') for q in sql))
        self.conn.rollback.assert_called_once()
        self.conn.commit.assert_not_called()

    def test_inicio_producao_busca_baixa_por_numero_exato(self):
        self.cursor.fetchone.side_effect = [{'status': 'pendente'}, {'c': 0}]
        self.cursor.fetchall.return_value = []
        response = self.client.patch('/pedidos/1/status', headers=self.headers, json={'status': 'producao'})
        self.assertEqual(response.status_code, 200)
        consulta = next(c for c in self.cursor.execute.call_args_list if 'motivo' in c.args[0])
        self.assertIn('motivo = CONCAT', consulta.args[0])
        self.assertNotIn('LIKE', consulta.args[0])
        self.assertEqual(consulta.args[1], ('1',))

    def test_exclusao_ja_aplicada_nao_devolve_saldo_novamente(self):
        self.cursor.fetchone.side_effect = [
            {'id': 1, 'tipo': 'exclusao', 'pedido_id': 2, 'status': 'pendente', 'dados_propostos': {}},
            None,
        ]
        response = self.client.patch('/solicitacoes/1/decisao', headers=self.headers, json={'decisao': 'aprovada'})
        self.assertEqual(response.status_code, 409)
        consultas = [c.args[0] for c in self.cursor.execute.call_args_list]
        self.assertTrue(all('FOR UPDATE' in q for q in consultas))
        self.conn.commit.assert_not_called()
        self.conn.rollback.assert_called_once()

    def test_rotas_novas_nao_executam_escrita_sem_csrf(self):
        for path, method in (('/pedidos/1', 'PUT'), ('/pedidos/1/status', 'PATCH'), ('/solicitacoes/1/decisao', 'PATCH')):
            with self.subTest(path=path):
                self.assertEqual(self.client.open(path, method=method, json={}).status_code, 403)
        self.open_pedidos.assert_not_called()
        self.open_solicitacoes.assert_not_called()
