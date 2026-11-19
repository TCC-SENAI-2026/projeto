"""HTTP com SQLite isolado; não valida os bloqueios de concorrência do MySQL."""
import unittest
from unittest.mock import patch

from test_perfil import TestPerfil
import solicitacoes


class TestSolicitacoesInativacao(unittest.TestCase):
    login = TestPerfil.login
    decidir = TestPerfil.decidir

    def setUp(self):
        TestPerfil.setUp(self)
        self.db.executescript('''
            CREATE TABLE estoque (id INTEGER PRIMARY KEY, nome_item TEXT, ativo INTEGER);
            CREATE TABLE clientes (id INTEGER PRIMARY KEY, nome TEXT, ativo INTEGER);
            INSERT INTO estoque VALUES (1, 'Camiseta', 1);
            INSERT INTO clientes VALUES (1, 'Cliente exemplo', 1);
        ''')

    def solicitar(self, alvo='estoque', motivo='Item danificado'):
        return self.client.post('/solicitacoes', headers=self.headers, json={
            'tipo': 'exclusao', f'{alvo}_id': 1, 'justificativa': motivo,
        })

    def ativo(self, tabela):
        return self.db.execute(f'SELECT ativo FROM {tabela} WHERE id=1').fetchone()[0]

    def test_aprovacao_dos_dois_alvos_e_listagem(self):
        for numero, alvo, tabela in ((1, 'estoque', 'estoque'), (2, 'cliente', 'clientes')):
            self.login(2)
            self.assertEqual(self.solicitar(alvo).status_code, 201)
            self.assertEqual(self.ativo(tabela), 1)
            self.assertEqual(self.solicitar(alvo).status_code, 409)
            self.assertEqual(self.decidir(id=numero).status_code, 403)
            self.login(1)
            lista = self.client.get('/solicitacoes').get_json()['data']
            item = next(s for s in lista if s['id'] == numero)
            self.assertEqual(item['justificativa'], 'Item danificado')
            self.assertEqual(item['clienteId' if alvo == 'cliente' else 'estoqueId'], 1)
            self.assertEqual(self.decidir(id=numero).status_code, 200)
            self.assertEqual(self.ativo(tabela), 0)
            self.assertEqual(self.decidir(id=numero).status_code, 409)

    def test_recusa_preserva_registro_e_permite_novo_envio(self):
        self.assertEqual(self.solicitar().status_code, 201)
        self.login(1)
        self.assertEqual(self.decidir('recusada').status_code, 200)
        self.assertEqual(self.ativo('estoque'), 1)
        self.login(2)
        self.assertEqual(self.solicitar().status_code, 201)

    def test_motivo_obrigatorio_e_alvo_unico(self):
        for motivo in ('', 'abc', ' ' * 10, 123, [], 'x' * 2001):
            self.assertEqual(self.solicitar(motivo=motivo).status_code, 400)
        resposta = self.client.post('/solicitacoes', headers=self.headers, json={
            'tipo': 'exclusao', 'cliente_id': 1, 'estoque_id': 1, 'justificativa': 'Motivo válido',
        })
        self.assertEqual(resposta.status_code, 400)

    def test_falha_na_decisao_desfaz_inativacao(self):
        self.assertEqual(self.solicitar().status_code, 201)
        self.login(1)
        self.falhar_status = True
        with self.assertRaises(RuntimeError):
            self.decidir()
        self.assertEqual(self.ativo('estoque'), 1)

    def test_outro_colaborador_nao_ve_solicitacao(self):
        self.assertEqual(self.solicitar().status_code, 201)
        self.login(3)
        self.assertEqual(self.client.get('/solicitacoes').get_json()['data'], [])

    def test_rotas_antigas_tambem_exigem_justificativa_e_criam_solicitacao(self):
        for metodo, url in ((self.client.delete, '/excluir-estoque/1'),
                            (self.client.post, '/excluir-cliente/1')):
            self.assertEqual(metodo(url, headers=self.headers).status_code, 400)
            res = metodo(url, headers=self.headers, json={'justificativa': 'Motivo informado'})
            self.assertEqual(res.status_code, 201, res.get_json())
        self.assertEqual(self.ativo('estoque'), 1)
        self.assertEqual(self.ativo('clientes'), 1)

    def test_formulario_cliente_nao_contorna_aprovacao(self):
        with patch('clientes.db_cursor', solicitacoes.db_cursor):
            res = self.client.post('/editar-cliente/1', headers=self.headers,
                                   data={'nome_empresa': 'Cliente', 'status': 'inativo'})
        self.assertEqual(res.status_code, 403, res.get_json())
        self.assertEqual(self.ativo('clientes'), 1)

    def reativar(self, motivo='Cliente voltou a comprar'):
        return self.client.post('/solicitacoes', headers=self.headers, json={
            'tipo': 'edicao', 'cliente_id': 1, 'justificativa': motivo,
        })

    def test_reativacao_exige_cliente_inativo_justificativa_e_aprovacao(self):
        self.assertEqual(self.reativar().status_code, 404)
        self.db.execute('UPDATE clientes SET ativo=0 WHERE id=1')
        self.db.commit()
        self.assertEqual(self.reativar('').status_code, 400)
        self.assertEqual(self.reativar().status_code, 201)
        self.assertEqual(self.ativo('clientes'), 0)
        self.assertEqual(self.reativar().status_code, 409)
        self.assertEqual(self.decidir().status_code, 403)
        self.login(1)
        item = self.client.get('/solicitacoes').get_json()['data'][0]
        self.assertTrue(item['reativar'])
        self.assertEqual(self.decidir().status_code, 200)
        self.assertEqual(self.ativo('clientes'), 1)

    def test_recusa_reativacao_preserva_inativo(self):
        self.db.execute('UPDATE clientes SET ativo=0 WHERE id=1')
        self.db.commit()
        self.assertEqual(self.reativar().status_code, 201)
        self.login(1)
        self.assertEqual(self.decidir('recusada').status_code, 200)
        self.assertEqual(self.ativo('clientes'), 0)

    def test_admin_nao_reativa_pelo_formulario(self):
        self.db.execute('UPDATE clientes SET ativo=0 WHERE id=1')
        self.db.commit()
        self.login(1)
        with patch('clientes.db_cursor', solicitacoes.db_cursor):
            res = self.client.post('/editar-cliente/1', headers=self.headers,
                                   data={'nome_empresa': 'Cliente', 'status': 'ativo'})
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.ativo('clientes'), 0)

    def test_edicao_sem_status_preserva_cliente_inativo(self):
        self.db.executescript('''
            ALTER TABLE clientes ADD COLUMN responsavel TEXT;
            ALTER TABLE clientes ADD COLUMN cpf_cnpj TEXT;
            ALTER TABLE clientes ADD COLUMN email TEXT;
            ALTER TABLE clientes ADD COLUMN telefone TEXT;
            ALTER TABLE clientes ADD COLUMN endereco TEXT;
            ALTER TABLE clientes ADD COLUMN logo_url TEXT;
            UPDATE clientes SET ativo=0 WHERE id=1;
        ''')
        with patch('clientes.db_cursor', solicitacoes.db_cursor), patch('clientes.salvar_logo', return_value=None):
            res = self.client.post('/editar-cliente/1', headers=self.headers,
                                   data={'nome_empresa': 'Nome atualizado'})
        self.assertEqual(res.status_code, 200, res.get_json())
        self.assertEqual(self.ativo('clientes'), 0)

    def test_cadastro_sem_status_cria_cliente_ativo(self):
        self.db.executescript('''
            ALTER TABLE clientes ADD COLUMN responsavel TEXT;
            ALTER TABLE clientes ADD COLUMN cpf_cnpj TEXT;
            ALTER TABLE clientes ADD COLUMN email TEXT;
            ALTER TABLE clientes ADD COLUMN telefone TEXT;
            ALTER TABLE clientes ADD COLUMN endereco TEXT;
            ALTER TABLE clientes ADD COLUMN logo_url TEXT;
        ''')
        with patch('clientes.db_cursor', solicitacoes.db_cursor), patch('clientes.salvar_logo', return_value=None):
            res = self.client.post('/cadastrar-cliente', headers=self.headers,
                                   data={'nome_empresa': 'Novo cliente', 'responsavel': 'Contato',
                                         'cpf_cnpj': '00.000.000/0001-00'})
            self.assertEqual(res.status_code, 200, res.get_json())
            self.assertEqual(self.client.get('/editar-cliente/2').json[1:3],
                             ['Contato', '00.000.000/0001-00'])
            res = self.client.post('/editar-cliente/2', headers=self.headers,
                                   data={'nome_empresa': 'Novo cliente', 'responsavel': 'Outro contato',
                                         'cpf_cnpj': '000.000.000-00'})
            self.assertEqual(res.status_code, 200, res.get_json())
            self.assertEqual(self.client.get('/editar-cliente/2').json[1:3],
                             ['Outro contato', '000.000.000-00'])
        self.assertEqual(self.db.execute('SELECT ativo FROM clientes WHERE id=2').fetchone()[0], 1)

    def reativar_estoque(self):
        return self.client.post('/solicitacoes', headers=self.headers, json={
            'tipo': 'edicao', 'estoque_id': 1, 'justificativa': 'Item voltou a ser utilizado',
        })

    def test_reativacao_estoque_exige_inativo_e_admin(self):
        self.assertEqual(self.reativar_estoque().status_code, 404)
        self.db.execute('UPDATE estoque SET ativo=0 WHERE id=1')
        self.db.commit()
        self.assertEqual(self.reativar_estoque().status_code, 201)
        self.assertEqual(self.ativo('estoque'), 0)
        self.assertEqual(self.reativar_estoque().status_code, 409)
        self.assertEqual(self.decidir().status_code, 403)
        self.login(1)
        item = self.client.get('/solicitacoes').get_json()['data'][0]
        self.assertTrue(item['reativar'])
        self.assertEqual(item['estoqueId'], 1)
        self.assertEqual(self.decidir().status_code, 200)
        self.assertEqual(self.ativo('estoque'), 1)

    def test_recusa_reativacao_estoque_preserva_inativo(self):
        self.db.execute('UPDATE estoque SET ativo=0 WHERE id=1')
        self.db.commit()
        self.assertEqual(self.reativar_estoque().status_code, 201)
        self.login(1)
        self.assertEqual(self.decidir('recusada').status_code, 200)
        self.assertEqual(self.ativo('estoque'), 0)

    def test_falha_na_decisao_desfaz_reativacao_estoque(self):
        self.db.execute('UPDATE estoque SET ativo=0 WHERE id=1')
        self.db.commit()
        self.assertEqual(self.reativar_estoque().status_code, 201)
        self.login(1)
        self.falhar_status = True
        with self.assertRaises(RuntimeError):
            self.decidir()
        self.assertEqual(self.ativo('estoque'), 0)


if __name__ == '__main__':
    unittest.main()
