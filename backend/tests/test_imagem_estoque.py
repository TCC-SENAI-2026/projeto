"""Rota Flask real e cache privado; sessão e consultas MySQL simuladas."""
from contextlib import contextmanager
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import create_app


class TestImagemEstoque(unittest.TestCase):
    def setUp(self):
        self.enterContext(patch('config.load_dotenv'))
        self.enterContext(patch.dict('config.os.environ', {}, clear=True))
        self.app = create_app({'TESTING': True, 'SECRET_KEY': 'foto-estoque-isolada'})
        self.client = self.app.test_client()
        auth = Mock()
        auth.fetchone.return_value = dict(id=1, ativo=1, conta_ativada=1,
                                         senha_hash='teste', nivel_acesso='colaborador')

        @contextmanager
        def autenticacao():
            yield auth

        self.enterContext(patch('auth.decorators.db_cursor', autenticacao))
        self.connection = Mock()
        self.cursor = self.connection.cursor.return_value
        self.cursor.fetchone.return_value = dict(imagem_dados=b'foto-de-teste', imagem_mime='image/jpeg')
        self.open_connection = self.enterContext(patch(
            'estoque.database_connection.open_connection', return_value=self.connection))
        with self.client.session_transaction() as session:
            session['colaborador_id'] = 1

    def test_foto_existente_retorna_binario_mime_etag_e_cache_privado(self):
        response = self.client.get('/estoque/12/imagem')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'foto-de-teste')
        self.assertEqual(response.mimetype, 'image/jpeg')
        self.assertTrue(response.headers.get('ETag'))
        self.assertEqual(response.headers['Cache-Control'], 'private, no-cache')
        self.assertEqual(self.cursor.execute.call_args.args[1], (12,))

    def test_sem_foto_e_item_inexistente_retornam_404(self):
        for row in (None, dict(imagem_dados=None, imagem_mime=None),
                    dict(imagem_dados=b'', imagem_mime='image/png')):
            with self.subTest(row=row):
                self.cursor.fetchone.return_value = row
                response = self.client.get('/estoque/12/imagem')
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_revalidacao_retornou_304_e_nova_foto_invalida_etag(self):
        versao = self.client.get('/estoque/12/imagem').headers['ETag']
        response = self.client.get('/estoque/12/imagem', headers={'If-None-Match': versao})
        self.assertEqual(response.status_code, 304)
        self.assertEqual(response.data, b'')
        self.assertEqual(response.headers['Cache-Control'], 'private, no-cache')
        self.cursor.fetchone.return_value = dict(imagem_dados=b'foto-atualizada', imagem_mime='image/jpeg')
        response = self.client.get('/estoque/12/imagem', headers={'If-None-Match': versao})
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.headers['ETag'], versao)

    def test_sessao_obrigatoria_inclusive_na_revalidacao(self):
        versao = self.client.get('/estoque/12/imagem').headers['ETag']
        self.open_connection.reset_mock()
        with self.client.session_transaction() as session:
            session.clear()
        response = self.client.get('/estoque/12/imagem', headers={'If-None-Match': versao})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        self.open_connection.assert_not_called()

    def test_alteracao_de_mime_tambem_invalida_etag(self):
        versao = self.client.get('/estoque/12/imagem').headers['ETag']
        self.cursor.fetchone.return_value['imagem_mime'] = 'image/webp'
        response = self.client.get('/estoque/12/imagem', headers={'If-None-Match': versao})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'image/webp')
        self.assertNotEqual(response.headers['ETag'], versao)
