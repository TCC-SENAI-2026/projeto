"""Rotas reais com saldos isolados em SQLite; sem conexão com MySQL.

O adaptador traduz placeholders, NOW/CONCAT e remove FOR UPDATE.
Concorrência e semântica dos locks InnoDB não são simuladas.
"""
from contextlib import contextmanager
from pathlib import Path
import sqlite3
import sys
import unittest
from unittest.mock import Mock, patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from estoque import estoque_bp
from pedidos import pedidos_bp
from solicitacoes import solicitacoes_bp


class TestControlePecas(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.addCleanup(self.db.close)
        self.db.row_factory = sqlite3.Row
        self.db.create_function('CONCAT', -1, lambda *args: ''.join(map(str, args)))
        self.db.create_function('NOW', 0, lambda: '2026-11-05 12:00:00')
        self.db.create_function('OCTET_LENGTH', 1, lambda value: len(value) if value is not None else None)
        self.db.executescript('''
            CREATE TABLE estoque (
                id INTEGER PRIMARY KEY, nome_item TEXT, tipo_item TEXT, unidade_medida TEXT,
                tem_variacoes INTEGER, quantidade_atual NUMERIC, ativo INTEGER DEFAULT 1,
                estoque_minimo NUMERIC DEFAULT 2, imagem_dados BLOB, imagem_mime TEXT);
            CREATE TABLE material_cores (
                id INTEGER PRIMARY KEY, material_id INTEGER, nome_cor TEXT, quantidade_atual NUMERIC,
                estoque_minimo NUMERIC DEFAULT 0, codigo_hex TEXT, valor_unitario NUMERIC,
                created_at TEXT, updated_at TEXT);
            CREATE TABLE pedidos (
                id INTEGER PRIMARY KEY, cliente_id INTEGER, status TEXT, excluido_em TEXT,
                numero_pedido INTEGER, colaborador_id INTEGER, data_pedido TEXT,
                prazo_entrega TEXT, prioridade TEXT, obs_geral TEXT,
                created_at TEXT, data_conclusao TEXT);
            CREATE TABLE clientes (id INTEGER PRIMARY KEY, nome TEXT, telefone TEXT, email TEXT, ativo INTEGER DEFAULT 1);
            CREATE TABLE colaboradores (id INTEGER PRIMARY KEY, nome TEXT);
            CREATE TABLE catalogo_itens (id INTEGER PRIMARY KEY, tipo TEXT, nome TEXT, ativo INTEGER DEFAULT 1);
            INSERT INTO clientes VALUES (1, 'Cliente Teste', NULL, NULL, 1);
            INSERT INTO colaboradores VALUES (1, 'Colaborador Teste');
            INSERT INTO catalogo_itens (id, tipo, nome) VALUES
                (1, 'produto', 'Camiseta'), (2, 'tecido', 'Algodao'),
                (3, 'cor', 'Preto'), (4, 'local', 'Gola'), (5, 'personalizacao', 'Bordado');
            CREATE TABLE pedido_itens (
                id INTEGER PRIMARY KEY, pedido_id INTEGER, estoque_id INTEGER,
                material_id INTEGER, material_cor_id INTEGER,
                tipo_produto_id INTEGER, personalizacao_id INTEGER DEFAULT 5, tecido_id INTEGER DEFAULT 2,
                cor_id INTEGER DEFAULT 3, local_arte_id INTEGER DEFAULT 4, observacao TEXT,
                imagem_url TEXT, imagem_mime TEXT, imagem_dados BLOB);
            CREATE TABLE pedido_item_tamanhos (pedido_item_id INTEGER, tamanho TEXT, quantidade INTEGER);
            CREATE TABLE estoque_movimentacoes (
                id INTEGER PRIMARY KEY, estoque_id INTEGER, tipo TEXT,
                quantidade NUMERIC, motivo TEXT, colaborador_id INTEGER);
            CREATE TABLE solicitacoes (
                id INTEGER PRIMARY KEY, tipo TEXT, pedido_id INTEGER, colaborador_alvo_id INTEGER, colaborador_solicitante_id INTEGER, status TEXT,
                dados_propostos TEXT, administrador_id INTEGER, data_decisao TEXT);
            INSERT INTO pedidos (id, cliente_id, colaborador_id, numero_pedido, status) VALUES (1, 1, 1, 1, 'pendente');
            INSERT INTO solicitacoes (id, tipo, pedido_id, status, dados_propostos) VALUES (1, 'exclusao', 1, 'pendente', '{}');
        ''')
        # IDs 1/2: novos produtos. 3/4: legado por unidade. 5/6: material
        # e tecido novos. 7: produto legado em metros. 8: produto com variações.
        casos = [
            (1, 'produto', None, 0), (2, 'produto', '', 0),
            (3, 'produto', 'Unidade', 0), (4, 'material', 'Unidade', 0),
            (5, 'material', None, 0), (6, 'material', None, 1),
            (7, 'produto', 'Metro', 0), (8, 'produto', None, 1),
            (9, 'material', 'm', 1), (10, 'produto', 'Peça', 0),
        ]
        self.controlados = {1, 2, 3, 4}
        for item_id, tipo, unidade, variacoes in casos:
            self.db.execute('INSERT INTO estoque (id, nome_item, tipo_item, unidade_medida, tem_variacoes, quantidade_atual, ativo) VALUES (?, ?, ?, ?, ?, 10, 1)',
                            (item_id, f'Item {item_id}', tipo, unidade, variacoes))
            self.db.execute('INSERT INTO pedido_itens (id, pedido_id, estoque_id) VALUES (?, 1, ?)',
                            (item_id, item_id))
            self.db.execute('INSERT INTO pedido_item_tamanhos VALUES (?, "M", 3)', (item_id,))
        self.db.executescript("""
            INSERT INTO material_cores (id, material_id, nome_cor, quantidade_atual, estoque_minimo) VALUES
                (101, 6, 'Preto', 10, 2), (102, 6, 'Vermelho', 0, 2),
                (103, 9, 'Azul', 5, 2), (104, 9, 'Branco', 1, 2);
        """)
        self.db.commit()
        banco = self.db

        class Cursor:
            def execute(self, sql, params=()):
                valores = tuple(str(v) if type(v).__name__ == 'Decimal' else v for v in params)
                self.cursor = banco.execute(sql.replace('%s', '?').replace('FOR UPDATE', ''), valores)
                self.lastrowid = self.cursor.lastrowid

            def fetchone(self):
                row = self.cursor.fetchone()
                return dict(row) if row else None

            def fetchall(self):
                return [dict(row) for row in self.cursor.fetchall()]

            def close(self):
                pass

        connection = Mock()
        connection.cursor.side_effect = lambda **kwargs: Cursor()
        connection.commit.side_effect = banco.commit
        connection.rollback.side_effect = banco.rollback
        for alvo in ('pedidos.open_connection', 'solicitacoes.open_connection',
                     'estoque.database_connection.open_connection'):
            self.enterContext(patch(alvo, return_value=connection))
        @contextmanager
        def leitura_pedidos(**kwargs):
            yield Cursor()

        self.enterContext(patch('pedidos.db_cursor', leitura_pedidos))
        auth = Mock()
        auth.fetchone.return_value = dict(id=1, ativo=1, conta_ativada=1,
                                         senha_hash='teste', nivel_acesso='administrador')

        @contextmanager
        def autenticacao():
            yield auth

        self.enterContext(patch('auth.decorators.db_cursor', autenticacao))
        app = Flask(__name__)
        app.config.update(TESTING=True, SECRET_KEY='controle-pecas-isolado')
        app.register_blueprint(estoque_bp)
        app.register_blueprint(pedidos_bp)
        app.register_blueprint(solicitacoes_bp)
        self.client = app.test_client()
        with self.client.session_transaction() as session:
            session['colaborador_id'] = 1

    def saldos(self):
        return {row['id']: row['quantidade_atual']
                for row in self.db.execute('SELECT id, quantidade_atual FROM estoque')}

    def iniciar(self):
        response = self.client.patch('/pedidos/1/status', json={'status': 'producao'})
        self.assertEqual(response.status_code, 200, response.get_json())

    def test_disponibilidade_produtos_novos_e_unidades_legadas(self):
        response = self.client.post('/estoque/verificar-disponibilidade', json={
            'itens': [dict(estoque_id=i, quantidade=11) for i in range(1, 11)]})
        self.assertEqual(response.status_code, 200)
        for item in response.get_json():
            self.assertEqual(item['disponivel'], item['estoque_id'] not in self.controlados)

    def test_inicio_baixa_so_elegiveis_e_preserva_demais_saldos(self):
        self.iniciar()
        for item_id, saldo in self.saldos().items():
            self.assertEqual(saldo, 7 if item_id in self.controlados else 10)
        movimentados = {row['estoque_id'] for row in self.db.execute('SELECT estoque_id FROM estoque_movimentacoes')}
        self.assertEqual(movimentados, self.controlados)

    def test_saldo_insuficiente_de_produto_novo_desfaz_inicio(self):
        self.db.execute('UPDATE estoque SET quantidade_atual = 2 WHERE id = 1')
        self.db.commit()
        response = self.client.patch('/pedidos/1/status', json={'status': 'producao'})
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.saldos()[1], 2)
        self.assertEqual(self.saldos()[3], 10)
        self.assertEqual(self.db.execute('SELECT status FROM pedidos').fetchone()[0], 'pendente')

    def test_exclusao_devolve_apenas_itens_com_baixa(self):
        self.iniciar()
        response = self.client.patch('/solicitacoes/1/decisao', json={'decisao': 'aprovada'})
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertTrue(all(saldo == 10 for saldo in self.saldos().values()))
        entradas = {row['estoque_id'] for row in self.db.execute(
            "SELECT estoque_id FROM estoque_movimentacoes WHERE tipo = 'entrada'")}
        self.assertEqual(entradas, self.controlados)

    def test_edicao_iniciada_ajusta_diferenca_so_dos_itens_controlados(self):
        self.iniciar()
        # A resolução do catálogo não faz parte desta alteração.
        with patch('pedidos._resolver_catalogo', return_value=1):
            response = self.client.put('/pedidos/1', json={'pedido': {'produtos': [
                dict(item='Camiseta', estoque_id=i, detalhes={'id': i}, grade={'M': 5})
                for i in range(1, 11)
            ]}})
        self.assertEqual(response.status_code, 200, response.get_json())
        for item_id, saldo in self.saldos().items():
            self.assertEqual(saldo, 5 if item_id in self.controlados else 10)

    def novo_pedido(self, estoque_id=1, material_id=6, material_cor_id=101):
        return self.client.post('/pedidos', json={
            'nome_cliente': 'Cliente Teste', 'data_pedido': '2026-11-08',
            'produtos': [dict(item='Nome enviado pelo cliente', estoque_id=estoque_id,
                              grade={'M': 3}, detalhes=dict(material_id=material_id, material_cor_id=material_cor_id, local='Gola'))],
        })

    def test_novo_sem_catalogo_exibe_nome_e_movimenta_estoque_escolhido(self):
        response = self.novo_pedido(2)
        self.assertEqual(response.status_code, 201, response.get_json())
        pedido_id = response.get_json()['data']['id']
        item = self.db.execute('SELECT * FROM pedido_itens WHERE pedido_id = ?', (pedido_id,)).fetchone()
        self.assertIsNone(item['tipo_produto_id'])
        self.assertEqual(item['estoque_id'], 2)
        self.assertEqual((item['material_id'], item['material_cor_id']), (6, 101))
        self.assertIsNone(item['tecido_id'])
        self.assertIsNone(item['cor_id'])
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM catalogo_itens WHERE tipo = 'produto'").fetchone()[0], 1)
        detalhe = self.client.get(f'/pedidos/{pedido_id}')
        self.assertEqual(detalhe.status_code, 200)
        self.assertEqual(detalhe.get_json()['data']['itens'][0]['tipo_produto'], 'Item 2')
        ficha = self.client.get(f'/pedidos/itens/{item["id"]}')
        self.assertEqual(ficha.status_code, 200)
        self.assertEqual(ficha.get_json()['data']['nome_produto'], 'Item 2')
        response = self.client.patch(f'/pedidos/{pedido_id}/status', json={'status': 'producao'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.saldos()[2], 7)
        self.assertEqual(self.saldos()[1], 10)
        self.db.execute("INSERT INTO solicitacoes (id, tipo, pedido_id, status) VALUES (2, 'exclusao', ?, 'pendente')", (pedido_id,))
        self.db.commit()
        response = self.client.patch('/solicitacoes/2/decisao', json={'decisao': 'aprovada'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.saldos()[2], 10)
        self.assertEqual(self.db.execute('SELECT quantidade_atual FROM material_cores WHERE id = 101').fetchone()[0], 10)
        self.assertEqual(self.saldos()[6], 10)

    def test_produtos_invalidos_ou_sem_saldo_rejeitados_sem_pedido_parcial(self):
        self.db.execute('UPDATE estoque SET quantidade_atual = 0 WHERE id = 1')
        self.db.execute('UPDATE estoque SET ativo = 0 WHERE id = 2')
        self.db.commit()
        for estoque_id in (1, 2, 5, 6, 8, 999, None, True, 'abc'):
            with self.subTest(estoque_id=estoque_id):
                response = self.novo_pedido(estoque_id)
                self.assertEqual(response.status_code, 400, response.get_json())
                self.assertTrue(response.get_json()['msg'])
                self.assertEqual(self.db.execute('SELECT COUNT(*) FROM pedidos').fetchone()[0], 1)

    def test_legado_sem_estoque_abre_com_nome_catalogo_e_nao_baixa(self):
        self.db.execute('UPDATE pedido_itens SET estoque_id = NULL, tipo_produto_id = 1 WHERE pedido_id = 1')
        self.db.commit()
        response = self.client.get('/pedidos/1')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(item['tipo_produto'] == 'Camiseta' for item in response.get_json()['data']['itens']))
        for item in response.get_json()['data']['itens']:
            self.assertEqual((item['tecido'], item['cor']), ('Algodao', 'Preto'))
            self.assertIsNone(item['material_id'])
        self.iniciar()
        self.assertTrue(all(saldo == 10 for saldo in self.saldos().values()))
        response = self.client.patch('/solicitacoes/1/decisao', json={'decisao': 'aprovada'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM estoque_movimentacoes').fetchone()[0], 0)

    def test_edicao_preserva_vinculos_legados_e_novos_mesmo_com_payload_diferente(self):
        self.db.execute('UPDATE pedido_itens SET tipo_produto_id = 1, estoque_id = NULL WHERE id = 1')
        self.db.commit()
        with patch('pedidos._resolver_catalogo', return_value=4):
            response = self.client.put('/pedidos/1', json={'pedido': {'produtos': [
                dict(item='Nome alterado', estoque_id=999, detalhes={'id': 1, 'local': 'Gola'}, grade={'M': 2}),
                dict(item='Item 2', estoque_id=999, detalhes={'id': 2}, grade={'M': 4}),
            ]}})
        self.assertEqual(response.status_code, 200, response.get_json())
        antigo = self.db.execute('SELECT * FROM pedido_itens WHERE id = 1').fetchone()
        novo = self.db.execute('SELECT * FROM pedido_itens WHERE id = 2').fetchone()
        self.assertEqual(antigo['tipo_produto_id'], 1)
        self.assertIsNone(antigo['estoque_id'])
        self.assertIsNone(novo['tipo_produto_id'])
        self.assertEqual(novo['estoque_id'], 2)

    def test_adiciona_item_de_estoque_na_edicao_com_catalogo_nulo(self):
        response = self.client.put('/pedidos/1', json={'pedido': {'produtos': [
            dict(item='Ignorado', estoque_id=3, detalhes=dict(material_id=6, material_cor_id=101, local='Capuz'), grade={'M': 2}),
        ]}})
        self.assertEqual(response.status_code, 200, response.get_json())
        item = self.db.execute('SELECT * FROM pedido_itens WHERE pedido_id = 1').fetchone()
        self.assertEqual(item['estoque_id'], 3)
        self.assertIsNone(item['tipo_produto_id'])

    def test_endpoint_produtos_filtra_tipo_variacoes_e_ativo_mantendo_sem_saldo(self):
        self.db.execute('UPDATE estoque SET quantidade_atual = 0 WHERE id = 1')
        self.db.execute('UPDATE estoque SET ativo = 0 WHERE id = 2')
        self.db.commit()
        response = self.client.get('/estoque/produtos-pedido')
        self.assertEqual(response.status_code, 200)
        itens = response.get_json()
        self.assertEqual({p['id'] for p in itens}, {1, 3, 7, 10})
        self.assertEqual(set(itens[0]), {'id', 'nome', 'quantidade_atual', 'estoque_minimo', 'tem_imagem'})

    def test_endpoint_produtos_exige_sessao(self):
        with self.client.session_transaction() as session:
            session.clear()
        self.assertEqual(self.client.get('/estoque/produtos-pedido').status_code, 401)

    def test_lista_produtos_devolve_indicador_de_foto_sem_blob(self):
        self.db.execute('UPDATE estoque SET imagem_dados = ?, imagem_mime = ? WHERE id = 1',
                        (b'imagem', 'image/png'))
        self.db.execute('UPDATE estoque SET imagem_dados = ? WHERE id = 2', (b'',))
        self.db.commit()
        response = self.client.get('/estoque/produtos-pedido')
        self.assertEqual(response.status_code, 200)
        mapa = {item['id']: item for item in response.get_json()}
        self.assertTrue(mapa[1]['tem_imagem'])
        self.assertFalse(mapa[2]['tem_imagem'])
        self.assertFalse(mapa[3]['tem_imagem'])
        for item in mapa.values():
            self.assertNotIn('imagem_dados', item)
            self.assertNotIn('imagem_mime', item)

    def test_legado_com_estoque_prefere_nome_catalogo_e_novo_usa_todos_locais(self):
        self.db.execute('UPDATE pedido_itens SET tipo_produto_id = 1 WHERE id = 1')
        self.db.execute("UPDATE estoque SET nome_item = 'Camiseta' WHERE id = 2")
        self.db.commit()
        antigo = self.client.get('/pedidos/itens/1').get_json()['data']
        self.assertEqual(antigo['nome_produto'], 'Camiseta')
        self.assertEqual(antigo['estoque_id'], 1)
        response = self.client.post('/pedidos', json={
            'nome_cliente': 'Cliente Teste', 'data_pedido': '2026-11-08',
            'produtos': [dict(estoque_id=2, grade={'M': 1},
                              detalhes=dict(material_id=6, material_cor_id=101, local='Capuz'))],
        })
        self.assertEqual(response.status_code, 201, response.get_json())
        with patch('pedidos._resolver_catalogo', return_value=4):
            response = self.client.put('/pedidos/1', json={'pedido': {'produtos': [
                dict(item='Camiseta', detalhes={'id': 1, 'local': 'Capuz'}, grade={'M': 2}),
            ]}})
        self.assertEqual(response.status_code, 400)
        self.assertIn('não é válido', response.get_json()['msg'])

    def test_rejeita_tecido_cor_incompativeis_sem_saldo_ou_invalidos(self):
        self.db.execute('UPDATE estoque SET ativo = 0 WHERE id = 9')
        self.db.commit()
        casos = [(6, 103), (6, 102), (5, 101), (9, 103), (999, 101),
                 (6, 999), (None, None), (True, 101), (6, 'abc')]
        for material_id, material_cor_id in casos:
            with self.subTest(material_id=material_id, cor=material_cor_id):
                response = self.novo_pedido(1, material_id, material_cor_id)
                self.assertEqual(response.status_code, 400, response.get_json())
                self.assertTrue(response.get_json()['msg'])
                self.assertEqual(self.db.execute('SELECT COUNT(*) FROM pedidos').fetchone()[0], 1)

    def test_consultas_novas_retornam_tecido_cor_do_estoque(self):
        self.db.execute("UPDATE estoque SET nome_item = 'Algodão' WHERE id = 6")
        self.db.commit()
        response = self.novo_pedido()
        self.assertEqual(response.status_code, 201)
        pedido_id = response.get_json()['data']['id']
        item = self.client.get(f'/pedidos/{pedido_id}').get_json()['data']['itens'][0]
        self.assertEqual((item['tecido'], item['cor']), ('Algodão', 'Preto'))
        self.assertEqual((item['material_id'], item['material_cor_id']), (6, 101))
        individual = self.client.get(f'/pedidos/itens/{item["id"]}')
        self.assertEqual(individual.status_code, 200)
        self.assertEqual(individual.get_json()['data']['tecido'], 'Algodão')

    def test_edicao_preserva_tecido_cor_novos_e_legados_contra_payload_alterado(self):
        response = self.novo_pedido()
        pedido_id = response.get_json()['data']['id']
        item_id = self.db.execute('SELECT id FROM pedido_itens WHERE pedido_id = ?', (pedido_id,)).fetchone()[0]
        self.db.execute('UPDATE estoque SET ativo = 0 WHERE id = 6')
        self.db.commit()
        for pedido, item, esperado in [(pedido_id, item_id, (None, None, 6, 101)), (1, 1, (2, 3, None, None))]:
            response = self.client.put(f'/pedidos/{pedido}', json={'pedido': {'produtos': [dict(
                item='Ignorado', detalhes=dict(id=item, material_id=9, material_cor_id=103,
                                               tecido='Outro', cor='Outra', local='Gola'), grade={'M': 4},
            )]}})
            self.assertEqual(response.status_code, 200, response.get_json())
            valores = self.db.execute('SELECT tecido_id, cor_id, material_id, material_cor_id FROM pedido_itens WHERE id = ?', (item,)).fetchone()
            self.assertEqual(tuple(valores), esperado)

    def test_cor_vinculada_por_novo_pedido_nao_pode_ser_removida(self):
        self.assertEqual(self.novo_pedido().status_code, 201)
        response = self.client.put('/editar-estoque/6', json=dict(
            tipo_item='material', nome_item='Algodão', tem_variacoes=True,
            cores=[dict(id=102, nome_cor='Vermelho', quantidade_atual=0)],
        ))
        self.assertEqual(response.status_code, 400)
        self.assertIn('vinculada a pedido', response.get_json()['message'])
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM material_cores WHERE material_id = 6').fetchone()[0], 2)

    def test_adicao_na_edicao_rejeita_cor_de_outro_tecido_sem_apagar_itens(self):
        response = self.client.put('/pedidos/1', json={'pedido': {'produtos': [dict(
            estoque_id=1, detalhes=dict(material_id=6, material_cor_id=103, local='Gola'), grade={'M': 1},
        )]}})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM pedido_itens WHERE pedido_id = 1').fetchone()[0], 10)

    def test_novo_pedido_salva_observacao_geral_e_ignora_observacao_por_item(self):
        response = self.client.post('/pedidos', json={
            'nome_cliente': 'Cliente Teste', 'data_pedido': '2026-11-08', 'obs_geral': 'Entrega urgente',
            'produtos': [dict(estoque_id=1, grade={'M': 2}, detalhes=dict(
                material_id=6, material_cor_id=101, local='Gola', observacao='Não deve ser gravada'))],
        })
        self.assertEqual(response.status_code, 201, response.get_json())
        pedido_id = response.get_json()['data']['id']
        self.assertEqual(self.db.execute('SELECT obs_geral FROM pedidos WHERE id = ?', (pedido_id,)).fetchone()[0], 'Entrega urgente')
        self.assertIsNone(self.db.execute('SELECT observacao FROM pedido_itens WHERE pedido_id = ?', (pedido_id,)).fetchone()[0])
        consultado = self.client.get(f'/pedidos/{pedido_id}').get_json()['data']
        self.assertEqual(consultado['obs_geral'], 'Entrega urgente')

    def test_edicao_preserva_observacao_legada_com_ou_sem_arte_e_edita_geral(self):
        self.db.execute("UPDATE pedido_itens SET observacao = 'Texto histórico' WHERE id = 1")
        self.db.commit()
        for detalhes in (dict(id=1, local='Gola'),
                         dict(id=1, local='Gola', observacao='', arteNova='data:image/png;base64,aW1hZ2Vt')):
            with self.subTest(com_arte=bool(detalhes.get('arteNova'))):
                response = self.client.put('/pedidos/1', json={
                    'ficha': {'observacao': 'Geral atualizada'},
                    'pedido': {'produtos': [dict(item='Item 1', detalhes=detalhes, grade={'M': 4})]},
                })
                self.assertEqual(response.status_code, 200, response.get_json())
                self.assertEqual(self.db.execute('SELECT observacao FROM pedido_itens WHERE id = 1').fetchone()[0], 'Texto histórico')
                self.assertEqual(self.db.execute('SELECT obs_geral FROM pedidos WHERE id = 1').fetchone()[0], 'Geral atualizada')
        item = self.client.get('/pedidos/itens/1').get_json()['data']
        self.assertEqual(item['observacao'], 'Texto histórico')

    def test_item_adicionado_na_edicao_grava_observacao_nula(self):
        response = self.client.put('/pedidos/1', json={'pedido': {'produtos': [dict(
            estoque_id=1, grade={'M': 1}, detalhes=dict(material_id=6, material_cor_id=101,
                                                     local='Gola', observacao='Ignorar'),
        )]}})
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertIsNone(self.db.execute('SELECT observacao FROM pedido_itens WHERE pedido_id = 1').fetchone()[0])
