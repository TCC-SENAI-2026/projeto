"""Fluxo HTTP real com SQLite isolado; FOR UPDATE é adaptado, não simula InnoDB."""
import base64
from contextlib import contextmanager
import io
import json
from pathlib import Path
import sqlite3
import sys
import unittest
from unittest.mock import Mock, patch

from flask import session
from mysql.connector import IntegrityError
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import create_app


def foto_base64(cor='red', tamanho=(16, 16)):
    arquivo = io.BytesIO()
    Image.new('RGB', tamanho, cor).save(arquivo, 'JPEG')
    return 'data:image/jpeg;base64,' + base64.b64encode(arquivo.getvalue()).decode('ascii')


class TestPerfil(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.addCleanup(self.db.close)
        self.db.row_factory = sqlite3.Row
        self.db.create_function('NOW', 0, lambda: '2026-11-08 15:00:00')
        self.db.executescript('''
            CREATE TABLE colaboradores (
                id INTEGER PRIMARY KEY, re TEXT, nome TEXT, email TEXT UNIQUE COLLATE NOCASE,
                telefone TEXT, endereco TEXT, nivel_acesso TEXT, cpf TEXT, salario NUMERIC,
                data_contrato TEXT, ativo INTEGER DEFAULT 1, foto_mime TEXT, foto_dados BLOB);
            INSERT INTO colaboradores (id,re,nome,email,nivel_acesso,cpf,salario,data_contrato) VALUES
                (1,'0001','Admin','admin@example.invalid','administrador','111',1000,'2026-01-01'),
                (2,'0002','Pessoa','pessoa@example.invalid','colaborador','222',900,'2026-02-01'),
                (3,'0003','Outra','outra@example.invalid','colaborador','333',800,'2026-03-01');
            CREATE TABLE solicitacoes (
                id INTEGER PRIMARY KEY, tipo TEXT, pedido_id INTEGER, estoque_id INTEGER,
                colaborador_alvo_id INTEGER REFERENCES colaboradores(id), colaborador_solicitante_id INTEGER,
                dados_propostos TEXT, status TEXT, administrador_id INTEGER,
                data_solicitacao TEXT DEFAULT CURRENT_TIMESTAMP, data_decisao TEXT,
                CHECK ((pedido_id IS NOT NULL)+(estoque_id IS NOT NULL)+(colaborador_alvo_id IS NOT NULL)=1));
        ''')
        self.db.commit()
        self.queries = []
        self.falhar_status = False
        self.colisao_email = False
        teste = self

        class Cursor:
            def execute(self, sql, params=()):
                teste.queries.append((sql, params))
                if teste.falhar_status and 'UPDATE solicitacoes' in sql:
                    raise RuntimeError('Falha simulada ao concluir decisão')
                if teste.colisao_email and 'UPDATE colaboradores' in sql:
                    raise IntegrityError('E-mail duplicado', errno=1062)
                self.cursor = teste.db.execute(sql.replace('%s', '?').replace('FOR UPDATE', ''), params)
                self.lastrowid = self.cursor.lastrowid

            def fetchone(self):
                row = self.cursor.fetchone()
                return dict(row) if row else None

            def fetchall(self):
                return [dict(row) for row in self.cursor.fetchall()]

            def close(self):
                pass

        @contextmanager
        def dados(commit=False):
            try:
                yield Cursor()
                self.db.commit() if commit else self.db.rollback()
            except Exception:
                self.db.rollback()
                raise

        auth = Mock()

        def conta():
            row = self.db.execute('SELECT * FROM colaboradores WHERE id=?', (session.get('colaborador_id'),)).fetchone()
            return {**dict(row), 'conta_ativada': 1, 'senha_hash': 'teste'} if row else None

        auth.fetchone.side_effect = conta

        @contextmanager
        def autenticacao():
            yield auth

        self.enterContext(patch('auth.decorators.db_cursor', autenticacao))
        for modulo in ('perfil', 'solicitacoes'):
            self.enterContext(patch(f'{modulo}.db_cursor', dados))
        self.conn = Mock()
        self.conn.cursor.side_effect = lambda **kwargs: Cursor()
        self.conn.commit.side_effect = self.db.commit
        self.conn.rollback.side_effect = self.db.rollback
        for modulo in ('perfil', 'solicitacoes'):
            self.enterContext(patch(f'{modulo}.open_connection', return_value=self.conn))
        self.enterContext(patch('config.load_dotenv'))
        self.enterContext(patch.dict('config.os.environ', {}, clear=True))
        self.app = create_app({'TESTING': True, 'SECRET_KEY': 'perfil-isolado'})
        self.client = self.app.test_client()
        self.headers = {'X-CSRF-Token': 'csrf-perfil'}
        self.login(2)

    def login(self, usuario):
        with self.client.session_transaction() as sessao:
            sessao.update(colaborador_id=usuario, csrf_token='csrf-perfil')

    def propor(self, campos=None):
        return self.client.put('/perfil', headers=self.headers, json=campos or {'nome': 'Nome proposto'})

    def decidir(self, decisao='aprovada', id=1):
        return self.client.patch(f'/solicitacoes/{id}/decisao', headers=self.headers,
                                 json={'decisao': decisao, 'motivo': 'Motivo de teste'})

    def atual(self, id=2):
        return dict(self.db.execute('SELECT * FROM colaboradores WHERE id=?', (id,)).fetchone())

    def test_cria_proposta_propria_sem_alterar_dados_e_bloqueia_segunda(self):
        response = self.propor()
        self.assertEqual(response.status_code, 201, response.get_json())
        self.assertEqual(self.atual()['nome'], 'Pessoa')
        sol = dict(self.db.execute('SELECT * FROM solicitacoes').fetchone())
        self.assertEqual((sol['tipo'], sol['colaborador_alvo_id'], sol['colaborador_solicitante_id']), ('perfil', 2, 2))
        self.assertEqual(self.propor({'nome': 'Segunda'}).status_code, 409)
        perfil = self.client.get('/perfil').get_json()
        self.assertEqual(perfil['solicitacao']['status'], 'pendente')

    def test_outro_colaborador_e_campos_bloqueados_rejeitados(self):
        response = self.client.post('/solicitacoes', headers=self.headers, json={
            'tipo': 'perfil', 'colaborador_alvo_id': 3, 'dados_propostos': {'nome': 'Outro'},
        })
        self.assertEqual(response.status_code, 403)
        for campo in ('id', 're', 'cpf', 'nivel_acesso', 'salario', 'data_contrato', 'ativo', 'senha', 'senha_hash'):
            with self.subTest(campo=campo):
                self.assertEqual(self.propor({campo: 'proibido'}).status_code, 400)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM solicitacoes').fetchone()[0], 0)

    def test_email_duplicado_e_campos_invalidos(self):
        self.assertEqual(self.propor({'email': 'OUTRA@example.invalid'}).status_code, 409)
        for campos in ({'email': 'invalido'}, {'nome': ''}, {'telefone': 'abc'}, {'endereco': 'a' * 256}):
            self.assertEqual(self.propor(campos).status_code, 400)

    def test_aprova_nome_email_foto_em_transacao_e_lista_antes_depois(self):
        foto = foto_base64()
        self.assertEqual(self.propor({'nome': 'Novo nome', 'email': 'novo@example.invalid', 'foto': foto}).status_code, 201)
        self.assertIsNone(self.atual()['foto_dados'])
        self.login(1)
        listado = self.client.get('/solicitacoes').get_json()['data'][0]
        self.assertEqual(listado['tipo'], 'perfil')
        mudanca = next(a for a in listado['alteracoes'] if a['campo'] == 'foto')
        self.assertEqual(mudanca['novo'], foto)
        self.queries.clear()
        response = self.decidir()
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(self.atual()['nome'], 'Novo nome')
        self.assertEqual(self.atual()['email'], 'novo@example.invalid')
        self.assertEqual(self.atual()['foto_mime'], 'image/jpeg')
        self.assertEqual(self.atual()['foto_dados'], base64.b64decode(foto.split(',')[1]))
        sql = [q for q, _ in self.queries]
        verificacao = next(i for i, q in enumerate(sql) if 'email = %s AND id <>' in q)
        atualizacao = next(i for i, q in enumerate(sql) if 'UPDATE colaboradores' in q)
        self.assertLess(verificacao, atualizacao)
        self.assertIn('FOR UPDATE', sql[verificacao])
        self.assertEqual(self.db.execute('SELECT status FROM solicitacoes').fetchone()[0], 'aprovada')

    def test_recusa_preserva_dados_e_resultado_aparece_no_perfil(self):
        self.propor({'email': 'naoaplicar@example.invalid', 'foto': foto_base64()})
        antes = self.atual()
        self.login(1)
        self.assertEqual(self.decidir('recusada').status_code, 200)
        self.assertEqual(self.atual(), antes)
        self.login(2)
        resultado = self.client.get('/perfil').get_json()
        self.assertEqual(resultado['solicitacao']['status'], 'recusada')
        self.assertEqual(resultado['solicitacao']['motivo'], 'Motivo de teste')

    def test_nao_admin_nao_decide_admin_edita_proprio_direto(self):
        self.propor()
        self.assertEqual(self.decidir().status_code, 403)
        self.login(1)
        response = self.propor({'nome': 'Admin atualizado', 'foto': foto_base64()})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['modo'], 'direto')
        self.assertEqual(self.atual(1)['nome'], 'Admin atualizado')
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM solicitacoes').fetchone()[0], 1)

    def test_email_tomado_apos_proposta_impede_aprovacao_sem_alteracao_parcial(self):
        self.propor({'email': 'reservado@example.invalid', 'nome': 'Não aplicar'})
        self.db.execute("UPDATE colaboradores SET email='reservado@example.invalid' WHERE id=3")
        self.db.commit()
        self.login(1)
        self.assertEqual(self.decidir().status_code, 409)
        self.assertEqual(self.atual()['nome'], 'Pessoa')
        self.assertEqual(self.atual()['email'], 'pessoa@example.invalid')
        self.assertEqual(self.db.execute('SELECT status FROM solicitacoes').fetchone()[0], 'pendente')

    def test_falha_apos_update_do_colaborador_desfaz_toda_decisao(self):
        self.propor()
        self.login(1)
        self.falhar_status = True
        with self.assertRaises(RuntimeError):
            self.decidir()
        self.assertEqual(self.atual()['nome'], 'Pessoa')
        self.assertEqual(self.db.execute('SELECT status FROM solicitacoes').fetchone()[0], 'pendente')

    def test_colisao_da_constraint_unique_tambem_retorna_409_com_rollback(self):
        self.propor({'email': 'novo@example.invalid'})
        self.login(1)
        self.colisao_email = True
        self.assertEqual(self.decidir().status_code, 409)
        self.assertEqual(self.atual()['email'], 'pessoa@example.invalid')

    def test_foto_invalida_grande_e_acima_de_512_rejeitada(self):
        for foto in ('data:image/jpeg;base64,bmFvLWltYWdlbQ==', 'a' * 1500000, foto_base64(tamanho=(513, 1))):
            self.assertEqual(self.propor({'foto': foto}).status_code, 400)

    def test_perfil_sem_sessao_e_escrita_sem_csrf_rejeitados(self):
        self.assertEqual(self.client.put('/perfil', json={'nome': 'X'}).status_code, 403)
        with self.client.session_transaction() as sessao:
            sessao.clear()
        self.assertEqual(self.client.get('/perfil').status_code, 401)

    def test_listagem_de_perfil_nao_expoe_proposta_de_outro_colaborador(self):
        self.propor()
        self.login(3)
        self.assertEqual(self.client.get('/solicitacoes').get_json()['data'], [])
        self.assertIsNone(self.client.get('/perfil').get_json()['solicitacao'])

    def test_consulta_perfil_retorna_dados_reais_proprios_sem_blob(self):
        response = self.client.get('/perfil')
        self.assertEqual(response.status_code, 200)
        dados = response.get_json()['data']
        self.assertEqual((dados['id'], dados['nome'], dados['re']), (2, 'Pessoa', '0002'))
        self.assertEqual(dados['cpf'], '222')
        self.assertNotIn('foto_dados', dados)
        self.assertNotIn('senha_hash', dados)

    def test_remocao_de_foto_so_e_aplicada_apos_aprovacao(self):
        foto = foto_base64()
        original = base64.b64decode(foto.split(',')[1])
        self.db.execute('UPDATE colaboradores SET foto_mime=?, foto_dados=? WHERE id=2', ('image/jpeg', original))
        self.db.commit()
        self.assertEqual(self.propor({'foto': None}).status_code, 201)
        self.assertEqual(self.atual()['foto_dados'], original)
        self.login(1)
        self.assertEqual(self.decidir().status_code, 200)
        self.assertIsNone(self.atual()['foto_dados'])
        self.assertIsNone(self.atual()['foto_mime'])
