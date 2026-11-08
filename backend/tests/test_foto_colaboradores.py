"""Uploads e autorização reais do Flask; SQL e envio de e-mail simulados."""
from contextlib import contextmanager
import io
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import create_app
from resources.foto_colaborador import LIMITE_FOTO


def imagem(formato='JPEG'):
    arquivo = io.BytesIO()
    Image.new('RGB', (16, 12), '#2367aa').save(arquivo, formato)
    return arquivo.getvalue()


class TestFotoColaboradores(unittest.TestCase):
    def setUp(self):
        self.enterContext(patch('config.load_dotenv'))
        self.enterContext(patch.dict('config.os.environ', {}, clear=True))
        self.app = create_app({'TESTING': True, 'SECRET_KEY': 'colaborador-foto-isolado'})
        self.client = self.app.test_client()
        self.account = dict(id=1, re='0001', nome='Teste', ativo=1, conta_ativada=1,
                            senha_hash='teste', nivel_acesso='administrador')
        auth = Mock()
        auth.fetchone.side_effect = lambda: self.account
        self.cursor = Mock()
        self.cursor.lastrowid = 12
        self.cursor.fetchone.return_value = {'id': 12}

        @contextmanager
        def autenticacao():
            yield auth

        @contextmanager
        def dados(**kwargs):
            yield self.cursor

        self.enterContext(patch('auth.decorators.db_cursor', autenticacao))
        self.db = self.enterContext(patch('colaboradores.db_cursor', dados))
        self.enterContext(patch('colaboradores.criar_token_ativacao', return_value='token-simulado'))
        self.email = self.enterContext(patch('colaboradores.email_service.enviar_link_ativacao'))
        self.headers = {'X-CSRF-Token': 'token-csrf-teste'}
        with self.client.session_transaction() as session:
            session.update(colaborador_id=1, csrf_token='token-csrf-teste')
        self.form = dict(nome_completo='Teste', re='0123', email='teste@example.invalid',
                         nivel_acesso='padrao', status='ativo', preferencia_notificacoes='email')

    def test_upload_valido_identifica_conteudo_ignorando_mime_declarado(self):
        for formato, mime in [('JPEG', 'image/jpeg'), ('PNG', 'image/png'), ('WEBP', 'image/webp')]:
            with self.subTest(formato=formato):
                self.cursor.reset_mock()
                foto = imagem(formato)
                response = self.client.post('/cadastrar-colaborador', headers=self.headers, data={
                    **self.form, 'foto': (io.BytesIO(foto), 'arquivo.dat', 'application/octet-stream'),
                })
                self.assertEqual(response.status_code, 200, response.get_json())
                sql, valores = self.cursor.execute.call_args.args
                self.assertIn('foto_mime, foto_dados', sql)
                self.assertEqual(valores[-2:], (mime, foto))

    def test_arquivo_falso_truncado_formato_nao_permitido_e_tamanho_rejeitados(self):
        for foto in (b'nao e imagem', b'\xff\xd8\xff', imagem('GIF'), b'x' * (LIMITE_FOTO + 1)):
            with self.subTest(tamanho=len(foto)):
                self.cursor.reset_mock()
                response = self.client.post('/cadastrar-colaborador', headers=self.headers, data={
                    **self.form, 'foto': (io.BytesIO(foto), 'foto.jpg', 'image/jpeg'),
                })
                self.assertEqual(response.status_code, 400)
                self.cursor.execute.assert_not_called()
                response.close()
                response.request.environ['wsgi.input'].close()

    def test_edicao_preserva_foto_omitida_troca_e_remove_explicitamente(self):
        for extra, espera_foto in [({}, False), ({'remover_foto': 'true'}, True),
                                  ({'foto': (io.BytesIO(imagem()), 'foto.jpg')}, True)]:
            with self.subTest(removendo=extra.get('remover_foto')):
                self.cursor.reset_mock()
                response = self.client.post('/editar-colaborador/12', headers=self.headers, data={**self.form, **extra})
                self.assertEqual(response.status_code, 200, response.get_json())
                sql, valores = self.cursor.execute.call_args.args
                self.assertEqual('foto_dados = %s' in sql, espera_foto)
                if extra.get('remover_foto'):
                    self.assertEqual(valores[-3:-1], (None, None))

    def test_rota_foto_com_sessao_de_colaborador_mime_etag_e_revalidacao(self):
        foto = imagem()
        self.account['nivel_acesso'] = 'colaborador'
        self.cursor.fetchone.return_value = dict(foto_mime='image/jpeg', foto_dados=foto)
        response = self.client.get('/colaboradores/12/foto')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, foto)
        self.assertEqual(response.mimetype, 'image/jpeg')
        self.assertEqual(response.headers['Cache-Control'], 'private, no-cache')
        etag = response.headers['ETag']
        self.assertEqual(self.client.get('/colaboradores/12/foto', headers={'If-None-Match': etag}).status_code, 304)
        self.cursor.fetchone.return_value = dict(foto_mime='image/png', foto_dados=imagem('PNG'))
        response = self.client.get('/colaboradores/12/foto', headers={'If-None-Match': etag})
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.headers['ETag'], etag)

    def test_foto_ausente_inexistente_e_sem_sessao(self):
        for row in (None, dict(foto_mime=None, foto_dados=None)):
            self.cursor.fetchone.return_value = row
            self.assertEqual(self.client.get('/colaboradores/12/foto').status_code, 404)
        with self.client.session_transaction() as session:
            session.clear()
        self.cursor.reset_mock()
        self.assertEqual(self.client.get('/colaboradores/12/foto').status_code, 401)
        self.cursor.execute.assert_not_called()

    def test_lista_devolve_indicador_sem_blob(self):
        self.cursor.fetchall.return_value = [dict(id_colaborador=12, nome_completo='Teste', tem_foto=1,
                                                 nivel_acesso='colaborador')]
        response = self.client.get('/listar-colaboradores')
        self.assertEqual(response.status_code, 200)
        item = response.get_json()[0]
        self.assertTrue(item['tem_foto'])
        self.assertNotIn('foto_dados', item)
        self.assertNotIn('foto_mime', item)
        self.assertIn('AS tem_foto', self.cursor.execute.call_args.args[0])

    def test_escritas_continuam_exigindo_csrf_e_perfil_admin(self):
        self.assertEqual(self.client.post('/cadastrar-colaborador', data=self.form).status_code, 403)
        self.account['nivel_acesso'] = 'colaborador'
        self.assertEqual(self.client.post('/cadastrar-colaborador', headers=self.headers, data=self.form).status_code, 403)
