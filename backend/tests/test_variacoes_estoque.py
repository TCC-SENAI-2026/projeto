"""Contratos HTTP e atomicidade das variantes; conexão MySQL simulada."""
from contextlib import contextmanager
from pathlib import Path
import json
import sys
import unittest
from unittest.mock import Mock, patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from estoque import estoque_bp


class TestVariacoesEstoque(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.config.update(TESTING=True, SECRET_KEY='teste-variacoes')
        app.register_blueprint(estoque_bp)
        self.client = app.test_client()
        with self.client.session_transaction() as session:
            session['colaborador_id'] = 1
        auth = Mock()
        auth.fetchone.return_value = dict(id=1, ativo=1, conta_ativada=1,
                                         senha_hash='teste', nivel_acesso='administrador')

        @contextmanager
        def autenticacao():
            yield auth

        self.enterContext(patch('auth.decorators.db_cursor', autenticacao))
        self.connection = Mock()
        self.cursor = self.connection.cursor.return_value
        self.cursor.lastrowid = 10
        self.cursor.fetchall.return_value = []
        self.cursor.fetchone.return_value = dict(id=10, tem_variacoes=True)
        self.open_connection = self.enterContext(patch(
            'estoque.database_connection.open_connection', return_value=self.connection))
        self.dados = dict(tipo_item='material', nome_item='Algodão', tem_variacoes=True,
                          cores=[dict(nome_cor=nome, quantidade_atual=metros)
                                 for nome, metros in [('Preto', '10.50'), ('Branco', 20), ('Vermelho', 0)]])

    def test_cadastro_multipart_grava_pai_e_tres_cores_em_um_commit(self):
        dados = dict(self.dados, tem_variacoes='true', cores=json.dumps(self.dados['cores']))
        response = self.client.post('/cadastrar-estoque', data=dados)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()['id'], 10)
        chamadas = self.cursor.execute.call_args_list
        self.assertEqual(sum('INSERT INTO material_cores' in c.args[0] for c in chamadas), 3)
        for campo in ('categoria', 'unidade_medida', 'catalogo_item_id'):
            self.assertNotIn(campo, chamadas[0].args[0])
        self.connection.commit.assert_called_once()
        self.connection.rollback.assert_not_called()

    def test_rejeita_cores_invalidas_antes_de_abrir_conexao(self):
        casos = [[], [dict(nome_cor=' ')], [dict(nome_cor='Preto'), dict(nome_cor=' PRETO ')],
                 [dict(nome_cor='Azul', quantidade_atual=-1)],
                 [dict(nome_cor='Azul', quantidade_atual='NaN')],
                 [dict(nome_cor='Azul', quantidade_atual='0.001')],
                 [dict(nome_cor='', quantidade_atual=2)], 'json inválido']
        for cores in casos:
            with self.subTest(cores=cores):
                response = self.client.post('/cadastrar-estoque', json=dict(self.dados, cores=cores))
                self.assertEqual(response.status_code, 400)
        self.open_connection.assert_not_called()

    def test_ignora_linha_totalmente_vazia(self):
        self.dados['cores'].append(dict(nome_cor='', quantidade_atual='', estoque_minimo=''))
        self.assertEqual(self.client.post('/cadastrar-estoque', json=self.dados).status_code, 201)

    def test_falha_na_segunda_cor_desfaz_cadastro_inteiro(self):
        self.cursor.execute.side_effect = [None, None, None, RuntimeError('falha simulada')]
        self.assertEqual(self.client.post('/cadastrar-estoque', json=self.dados).status_code, 500)
        self.connection.rollback.assert_called_once()
        self.connection.commit.assert_not_called()

    def test_edicao_atualiza_tres_cores_e_adiciona_quarta(self):
        self.cursor.fetchall.return_value = [dict(id=i) for i in (1, 2, 3)]
        for i, cor in enumerate(self.dados['cores'], 1):
            cor['id'] = i
        self.dados['cores'].append(dict(nome_cor='Azul', quantidade_atual='3.25'))
        response = self.client.put('/editar-estoque/10', json=self.dados)
        self.assertEqual(response.status_code, 200)
        sql = [c.args[0] for c in self.cursor.execute.call_args_list]
        self.assertEqual(sum('UPDATE material_cores' in q for q in sql), 3)
        self.assertEqual(sum('INSERT INTO material_cores' in q for q in sql), 1)
        self.connection.commit.assert_called_once()

    def test_bloqueia_remocao_de_cor_usada_em_pedido(self):
        self.cursor.fetchall.return_value = [dict(id=1)]
        response = self.client.put('/editar-estoque/10', json=self.dados)
        self.assertEqual(response.status_code, 400)
        self.assertIn('vinculada a pedido', response.get_json()['message'])
        self.connection.rollback.assert_called_once()
        self.connection.commit.assert_not_called()

    def test_bloqueia_id_de_outro_material(self):
        self.dados['cores'][0]['id'] = 99
        response = self.client.put('/editar-estoque/10', json=self.dados)
        self.assertEqual(response.status_code, 400)
        self.assertIn('não pertence', response.get_json()['message'])
        self.connection.rollback.assert_called_once()

    def test_cliente_antigo_nao_apaga_variantes_omitidas(self):
        response = self.client.put('/editar-estoque/10', json=dict(tipo_item='material', nome_item='Algodão'))
        self.assertEqual(response.status_code, 400)
        self.connection.commit.assert_not_called()

    def test_edicao_de_id_inexistente_retorna_404_sem_escritas(self):
        self.cursor.fetchone.return_value = None
        response = self.client.put('/editar-estoque/999999', json=self.dados)
        self.assertEqual(response.status_code, 404)
        self.assertTrue(all(c.args[0].startswith('SELECT')
                            for c in self.cursor.execute.call_args_list))
        self.connection.rollback.assert_called_once()
        self.connection.commit.assert_not_called()

    def test_listagens_e_detalhe_retornam_cores_aninhadas(self):
        for rota in ('/listar-estoque', '/estoque/tecidos', '/estoque/10'):
            with self.subTest(rota=rota):
                material = dict(id=10, nome_item='Algodão', tem_variacoes=1)
                cores = [dict(id=1, material_id=10, nome_cor='Preto', quantidade_atual='10.50')]
                self.cursor.fetchone.return_value = material
                self.cursor.fetchall.side_effect = [cores] if rota == '/estoque/10' else [[material], cores]
                response = self.client.get(rota)
                self.assertEqual(response.status_code, 200)
                resultado = response.get_json()
                item = resultado if isinstance(resultado, dict) else resultado[0]
                self.assertEqual(item['cores'], cores)
                self.assertIs(item['tem_variacoes'], True)
                self.assertNotIn('grupo_tecido', item)

    def test_cadastro_sem_variacoes_continua_funcionando(self):
        response = self.client.post('/cadastrar-estoque', data=dict(
            tipo_item='material', nome_item='Linha'))
        self.assertEqual(response.status_code, 201)
        self.connection.commit.assert_called_once()

    def test_produto_novo_ignora_campos_legados_inclusive_catalogo(self):
        response = self.client.post('/cadastrar-estoque', json=dict(
            tipo_item='produto', nome_item='Camiseta', categoria='Uniforme',
            unidade_medida='Unidade', catalogo_item_id=123))
        self.assertEqual(response.status_code, 201)
        consulta = self.cursor.execute.call_args_list[0].args[0]
        for campo in ('categoria', 'unidade_medida', 'catalogo_item_id'):
            self.assertNotIn(campo, consulta)

    def test_edicao_nao_sobrescreve_campos_legados_com_ou_sem_imagem(self):
        import io
        for com_imagem in (False, True):
            with self.subTest(com_imagem=com_imagem):
                self.cursor.reset_mock()
                self.cursor.fetchone.return_value = dict(id=10, tem_variacoes=False)
                dados = dict(tipo_item='produto', nome_item='Camiseta', quantidade_atual='10',
                             estoque_minimo='2', categoria='', unidade_medida='', catalogo_item_id='')
                if com_imagem:
                    dados['imagem'] = (io.BytesIO(b'imagem-teste'), 'teste.png')
                response = self.client.put('/editar-estoque/10', data=dados)
                self.assertEqual(response.status_code, 200)
                consulta = next(c.args[0] for c in self.cursor.execute.call_args_list
                                if 'UPDATE estoque' in c.args[0])
                for campo in ('categoria', 'unidade_medida', 'catalogo_item_id'):
                    self.assertNotIn(campo, consulta)

    def test_tecidos_filtra_somente_ativo_e_tem_variacoes(self):
        response = self.client.get('/estoque/tecidos')
        self.assertEqual(response.status_code, 200)
        consulta = self.cursor.execute.call_args_list[0].args[0]
        self.assertIn('ativo = 1', consulta)
        self.assertIn('tem_variacoes = 1', consulta)
        for campo in ('categoria', 'unidade_medida', 'tipo_item'):
            self.assertNotIn(campo, consulta)


if __name__ == '__main__':
    unittest.main()
