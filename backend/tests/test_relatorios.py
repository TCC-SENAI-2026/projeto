"""Consultas reais sobre dados isolados em SQLite; nenhuma escrita no MySQL."""
from contextlib import contextmanager
from datetime import date
from pathlib import Path
import sqlite3
import sys
import unittest
from unittest.mock import Mock, patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from relatorios import relatorios_bp


class TestRelatorios(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.addCleanup(self.db.close)
        self.db.row_factory = sqlite3.Row
        self.db.create_function("MONTH", 1, lambda value: int(value[5:7]))
        self.db.executescript("""
            CREATE TABLE pedidos (id INTEGER, status TEXT, data_conclusao TEXT, excluido_em TEXT);
            CREATE TABLE pedido_itens (id INTEGER, pedido_id INTEGER);
            CREATE TABLE pedido_item_tamanhos (pedido_item_id INTEGER, quantidade INTEGER);
            CREATE TABLE estoque (ativo INTEGER, quantidade_atual INTEGER, estoque_minimo INTEGER);
            INSERT INTO pedidos VALUES
                (1, 'concluido', '2026-10-01', NULL),
                (2, 'concluido', '2026-10-31 23:59:59', NULL),
                (3, 'concluido', '2026-09-30', NULL),
                (4, 'concluido', '2026-10-20', '2026-10-21'),
                (5, 'cancelado', '2026-10-20', NULL),
                (6, 'pendente', NULL, NULL),
                (7, 'em_producao', NULL, NULL),
                (8, 'concluido', '2025-10-01', NULL),
                (9, 'concluido', '2026-11-01', NULL),
                (10, 'pendente', NULL, '2026-10-21');
            INSERT INTO pedido_itens VALUES (1,1),(2,1),(3,2),(4,3),(5,4),(6,5),(7,8),(8,9);
            INSERT INTO pedido_item_tamanhos VALUES
                (1,2),(1,3),(2,4),(3,6),(4,10),(5,100),(6,100),(7,100),(8,20);
            INSERT INTO estoque VALUES (1,0,5),(1,5,5),(1,6,5),(0,0,5);
        """)
        db = self.db

        class Cursor:
            def execute(self, sql, params=()):
                self.cursor = db.execute(sql.replace('%s', '?'), tuple(str(p) for p in params))
            def fetchone(self):
                return dict(self.cursor.fetchone())
            def fetchall(self):
                return [dict(row) for row in self.cursor.fetchall()]

        @contextmanager
        def dados():
            yield Cursor()

        self.enterContext(patch('relatorios.db_cursor', dados))
        self.enterContext(patch('relatorios.periodo_atual', return_value=(date(2026,10,1), date(2026,11,1))))
        self.account = dict(id=1, re='0001', nome='Teste', nivel_acesso='administrador',
                            ativo=1, conta_ativada=1, senha_hash='hash-teste')
        cursor = Mock()
        cursor.fetchone.side_effect = lambda: self.account

        @contextmanager
        def auth():
            yield cursor

        self.enterContext(patch('auth.decorators.db_cursor', auth))
        app = Flask(__name__)
        app.config.update(TESTING=True, SECRET_KEY='teste-isolado')
        app.register_blueprint(relatorios_bp)
        self.client = app.test_client()
        with self.client.session_transaction() as session:
            session['colaborador_id'] = 1

    def test_resumo_conta_pedidos_sem_multiplicar_por_itens_e_soma_pecas(self):
        response = self.client.get('/relatorios/resumo')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['data'], dict(
            ano=2026, mes=10, producao_total=15, pedidos_concluidos=2,
            pedidos_concluidos_total=5, pedidos_pendentes=1, pedidos_em_producao=1, estoque_baixo=2))

    def test_producao_anual_exclui_cancelados_excluidos_e_outros_anos(self):
        response = self.client.get('/relatorios/producao-mensal')
        self.assertEqual(response.status_code, 200)
        meses = response.get_json()['data']['meses']
        self.assertEqual(len(meses), 12)
        self.assertEqual([m['total'] for m in meses], [0,0,0,0,0,0,0,0,10,15,20,0])

    def test_banco_vazio_retorna_zeros(self):
        for tabela in ('pedidos', 'pedido_itens', 'pedido_item_tamanhos', 'estoque'):
            self.db.execute('DELETE FROM ' + tabela)
        dados = self.client.get('/relatorios/resumo').get_json()['data']
        self.assertEqual(dados['producao_total'], 0)
        self.assertEqual(dados['pedidos_concluidos'], 0)
        self.assertEqual(dados['estoque_baixo'], 0)
        meses = self.client.get('/relatorios/producao-mensal').get_json()['data']['meses']
        self.assertTrue(all(m['total'] == 0 for m in meses))

    def test_rotas_exigem_administrador(self):
        for rota in ('/relatorios/resumo', '/relatorios/producao-mensal'):
            self.account['nivel_acesso'] = 'colaborador'
            self.assertEqual(self.client.get(rota).status_code, 403)
            with self.client.session_transaction() as session:
                session.clear()
            self.assertEqual(self.client.get(rota).status_code, 401)
            with self.client.session_transaction() as session:
                session['colaborador_id'] = 1


if __name__ == '__main__':
    unittest.main()
