"""T01/T03: factory, configuração, rotas reais e limpeza de conexões.

Toda conexão é substituída por mocks. As views de negócio são substituídas
somente depois do registro das rotas, preservando as guards reais do Flask.
Nenhum teste lê/escreve o banco ou envia e-mails.
"""

from contextlib import contextmanager
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

from mysql.connector import Error as DatabaseError


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app
from config import load_config
from database.connection import db_cursor


class ApplicationInfrastructureTests(unittest.TestCase):
    def setUp(self):
        # O .env e as variáveis reais da máquina não participam da fixture.
        self.enterContext(patch("config.load_dotenv"))
        self.enterContext(patch.dict("config.os.environ", {
            "APP_ENV": "development",
            "SECRET_KEY": "fixture-only-session-signing-key",
        }, clear=True))
        self.pool = self.enterContext(patch("database.connection.MySQLConnectionPool"))
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()
        self.account = {
            "id": 1, "re": "0001", "nome": "Fixture",
            "nivel_acesso": "administrador", "ativo": 1, "conta_ativada": 1,
            "senha_hash": "fixture-hash-not-used-for-password-verification",
        }
        self.cursor = Mock()
        self.cursor.fetchone.side_effect = lambda: dict(self.account)

        @contextmanager
        def fake_cursor():
            yield self.cursor

        self.auth_db = self.enterContext(patch("auth.decorators.db_cursor", side_effect=fake_cursor))
        self.legacy_connection = self.enterContext(patch("resources.database_connection.open_connection"))
        # Estas respostas provam que a guard liberou/bloqueou a URL real, sem
        # executar o SQL legado dos módulos fora do escopo T01/T02/T03.
        self.collaborators_view = Mock(return_value=({"fixture_view_reached": True}, 200))
        self.clients_view = Mock(return_value=({"fixture_view_reached": True}, 200))
        self.stock_view = Mock(return_value=({"fixture_view_reached": True}, 200))
        self.enterContext(patch.dict(self.app.view_functions, {
            "colaboradores.listar_colaboradores": self.collaborators_view,
            "clientes.listar_clientes": self.clients_view,
            "estoque.listar_estoque": self.stock_view,
        }))

    def tearDown(self):
        self.pool.assert_not_called()
        self.legacy_connection.assert_not_called()

    def authenticate_session(self, role="administrador"):
        self.account["nivel_acesso"] = role
        with self.client.session_transaction() as current:
            current["colaborador_id"] = self.account["id"]

    def test_factory_starts_without_creating_mysql_pool(self):
        self.assertIsNone(self.app.extensions["database"]["pool"])
        self.assertIn("login.login", self.app.view_functions)
        self.assertIn("colaboradores.listar_colaboradores", self.app.view_functions)
        self.assertEqual(self.client.get("/csrf").status_code, 200)
        self.auth_db.assert_not_called()

    def test_real_administrative_url_rejects_anonymous_user(self):
        response = self.client.get("/listar-colaboradores")
        self.assertEqual(response.status_code, 401)
        self.collaborators_view.assert_not_called()
        self.auth_db.assert_not_called()

    def test_real_administrative_url_rejects_collaborator(self):
        self.authenticate_session("colaborador")
        response = self.client.get("/listar-colaboradores")
        self.assertEqual(response.status_code, 403)
        self.collaborators_view.assert_not_called()
        self.cursor.execute.assert_called_once()
        self.assertEqual(self.cursor.execute.call_args.args[1], (1,))

    def test_real_administrative_url_allows_admin_to_reach_stub_view(self):
        self.authenticate_session()
        response = self.client.get("/listar-colaboradores")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["fixture_view_reached"])
        self.collaborators_view.assert_called_once_with()
        self.auth_db.assert_called_once_with()

    def test_real_business_urls_require_authentication(self):
        for path, view in (("/listar-clientes", self.clients_view), ("/listar-estoque", self.stock_view)):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 401)
                view.assert_not_called()
        self.auth_db.assert_not_called()

    def test_collaborator_can_reach_clients_and_stock_stub_views(self):
        self.authenticate_session("colaborador")
        for path, view in (("/listar-clientes", self.clients_view), ("/listar-estoque", self.stock_view)):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)
                view.assert_called_once_with()
        self.assertEqual(self.auth_db.call_count, 2)

    def test_csrf_is_checked_before_guards_of_real_routes(self):
        # Sem CSRF → 403 antes da autenticação. Com CSRF, a mesma URL chega à
        # guard de autenticação e responde 401, sem executar o cadastro legado.
        self.authenticate_session("colaborador")
        response = self.client.post("/cadastrar-colaborador", json={})
        self.assertEqual(response.status_code, 403)
        self.assertIn("CSRF", response.get_json()["msg"])
        self.auth_db.assert_not_called()
        with self.client.session_transaction() as current:
            current.clear()
        token = self.client.get("/csrf").get_json()["csrf_token"]
        response = self.client.post("/cadastrar-colaborador", json={}, headers={"X-CSRF-Token": token})
        self.assertEqual(response.status_code, 401)
        self.auth_db.assert_not_called()

    def test_csrf_protects_every_registered_write_before_business_logic(self):
        token = self.client.get("/csrf").get_json()["csrf_token"]
        other_token = self.app.test_client().get("/csrf").get_json()["csrf_token"]
        writes = 0
        for rule in self.app.url_map.iter_rules():
            for method in rule.methods & {"POST", "PUT", "PATCH", "DELETE"}:
                writes += 1
                path = rule.build({argument: 1 for argument in rule.arguments})[1]
                view = Mock(return_value={"fixture_view_reached": True})
                with patch.dict(self.app.view_functions, {rule.endpoint: view}):
                    for received in (None, "invalido", other_token):
                        with self.subTest(path=path, method=method, token=received):
                            headers = {} if received is None else {"X-CSRF-Token": received}
                            response = self.client.open(path, method=method, headers=headers)
                            self.assertEqual(response.status_code, 403)
                            self.assertIn("CSRF", response.get_json()["msg"])
                            view.assert_not_called()
                    self.authenticate_session()
                    response = self.client.open(path, method=method, headers={"X-CSRF-Token": token})
                    self.assertEqual(response.status_code, 200)
                    view.assert_called_once()
        self.assertGreater(writes, 0)

    def test_cors_allows_only_configured_frontend_with_credentials(self):
        allowed = self.client.get("/csrf", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(allowed.headers["Access-Control-Allow-Origin"], "http://localhost:5173")
        self.assertEqual(allowed.headers["Access-Control-Allow-Credentials"], "true")
        denied = self.client.get("/csrf", headers={"Origin": "https://untrusted.example"})
        self.assertNotIn("Access-Control-Allow-Origin", denied.headers)
        self.assertNotIn("Access-Control-Allow-Credentials", denied.headers)

    def test_cors_preflight_allows_csrf_header_without_authentication(self):
        response = self.client.options("/cadastrar-colaborador", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, X-CSRF-Token",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("X-CSRF-Token", response.headers["Access-Control-Allow-Headers"])
        self.auth_db.assert_not_called()

    def test_api_responses_cannot_be_cached_including_guard_errors(self):
        for path in ("/csrf", "/me", "/listar-colaboradores", "/listar-clientes", "/listar-estoque", "/missing"):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).headers["Cache-Control"], "no-store")


class ConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.enterContext(patch("config.load_dotenv"))
        self.enterContext(patch.dict("config.os.environ", {}, clear=True))

    def test_production_requires_secret_key_of_at_least_32_characters(self):
        for secret in ("", "x" * 31):
            with self.subTest(length=len(secret)), patch.dict("config.os.environ", {
                "APP_ENV": "production", "SECRET_KEY": secret,
            }):
                with self.assertRaises(ValueError):
                    load_config()

    def test_production_config_sets_secure_httponly_and_samesite(self):
        with patch.dict("config.os.environ", {"APP_ENV": "production", "SECRET_KEY": "x" * 32}):
            configuration = load_config()
        self.assertTrue(configuration["SESSION_COOKIE_SECURE"])
        self.assertTrue(configuration["SESSION_COOKIE_HTTPONLY"])
        self.assertEqual(configuration["SESSION_COOKIE_SAMESITE"], "Lax")

    def test_development_config_generates_process_key_without_real_secrets(self):
        configuration = load_config()
        self.assertGreaterEqual(len(configuration["SECRET_KEY"]), 32)
        self.assertFalse(configuration["SESSION_COOKIE_SECURE"])


class DatabaseCursorTests(unittest.TestCase):
    def setUp(self):
        self.connection = Mock()
        self.cursor = self.connection.cursor.return_value
        self.open_connection = self.enterContext(patch(
            "database.connection.open_connection", return_value=self.connection,
        ))

    def test_read_uses_named_buffered_cursor_and_rolls_back_before_returning_pool_connection(self):
        with db_cursor() as cursor:
            self.assertIs(cursor, self.cursor)
            cursor.execute("SELECT 1")  # Mock somente; não executa no MySQL.
        self.connection.cursor.assert_called_once_with(dictionary=True, buffered=True)
        self.connection.rollback.assert_called_once_with()
        self.connection.commit.assert_not_called()
        self.cursor.close.assert_called_once_with()
        self.connection.close.assert_called_once_with()

    def test_write_commits_only_after_success_and_closes_resources(self):
        with db_cursor(commit=True) as cursor:
            self.assertIs(cursor, self.cursor)
            self.connection.commit.assert_not_called()
        self.connection.commit.assert_called_once_with()
        self.connection.rollback.assert_not_called()
        self.cursor.close.assert_called_once_with()
        self.connection.close.assert_called_once_with()

    def test_error_in_block_rolls_back_and_closes_resources(self):
        with self.assertRaisesRegex(ValueError, "fixture error"):
            with db_cursor(commit=True):
                raise ValueError("fixture error")
        self.connection.rollback.assert_called_once_with()
        self.connection.commit.assert_not_called()
        self.cursor.close.assert_called_once_with()
        self.connection.close.assert_called_once_with()

    def test_cursor_creation_failure_rolls_back_and_returns_connection(self):
        self.connection.cursor.side_effect = DatabaseError("fixture error")
        with self.assertRaises(DatabaseError):
            with db_cursor():
                self.fail("Bloco não deve começar sem cursor.")
        self.connection.rollback.assert_called_once_with()
        self.connection.commit.assert_not_called()
        self.connection.close.assert_called_once_with()

    def test_commit_failure_rolls_back_and_closes_resources(self):
        self.connection.commit.side_effect = DatabaseError("fixture error")
        with self.assertRaises(DatabaseError):
            with db_cursor(commit=True):
                pass
        self.connection.rollback.assert_called_once_with()
        self.cursor.close.assert_called_once_with()
        self.connection.close.assert_called_once_with()

    def test_cursor_close_failure_still_returns_connection(self):
        self.cursor.close.side_effect = DatabaseError("fixture error")
        with self.assertRaises(DatabaseError):
            with db_cursor():
                pass
        self.connection.close.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
