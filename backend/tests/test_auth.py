"""Testes isolados de T03: Flask real, banco substituído explicitamente.

Não conectam ao MySQL e não criam usuários reais. Os registros abaixo só vivem
na memória de cada teste. Execute: python -m unittest discover -s backend/tests.
As rotas probe existem apenas nesta fixture e não são funcionalidades da API.
"""

from contextlib import contextmanager
from copy import deepcopy
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

from flask import Flask, jsonify
from mysql.connector import Error as DatabaseError
from werkzeug.security import generate_password_hash


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from auth.csrf import init_csrf
from auth.decorators import admin_required, login_required
from login import login_bp


class AuthTests(unittest.TestCase):
    """Exercita cookies, CSRF e autorização sem infraestrutura externa."""

    @classmethod
    def setUpClass(cls):
        # Senha exclusiva da fixture: nunca é usada por script ou conta real.
        cls.password = "Senha temporaria somente do teste!"
        cls.password_hash = generate_password_hash(cls.password)

    def setUp(self):
        self.accounts = {
            1: {
                "id": 1, "re": "ADMIN-FIXTURE", "nome": "Administrador de teste",
                "nivel_acesso": "administrador", "senha_hash": self.password_hash,
                "ativo": 1, "conta_ativada": 1,
            },
            2: {
                "id": 2, "re": "COLAB-FIXTURE", "nome": "Colaborador de teste",
                "nivel_acesso": "colaborador", "senha_hash": self.password_hash,
                "ativo": 1, "conta_ativada": 1,
            },
        }
        self.queries = []
        self.mutations = []
        self.app = Flask(__name__)
        self.app.config.update(
            TESTING=True,
            SECRET_KEY="fixture-only-session-signing-key",
            SESSION_COOKIE_HTTPONLY=True,
            SESSION_COOKIE_SAMESITE="Lax",
            SESSION_COOKIE_SECURE=False,
        )
        init_csrf(self.app)
        self.app.register_blueprint(login_bp)

        @self.app.get("/protected-probe")
        @login_required
        def protected_probe():
            return jsonify({"success": True})

        @self.app.get("/admin-probe")
        @admin_required
        def admin_probe():
            return jsonify({"success": True})

        @self.app.route("/mutation-probe", methods=["POST", "PUT", "PATCH", "DELETE"])
        @login_required
        def mutation_probe():
            self.mutations.append(True)
            return jsonify({"success": True})

        @contextmanager
        def fake_cursor():
            cursor = Mock()

            def execute(sql, params):
                self.queries.append((sql, params))
                if "WHERE re = %s" in sql:
                    account = next(
                        (account for account in self.accounts.values() if account["re"] == params[0]),
                        None,
                    )
                else:
                    self.assertIn("WHERE id = %s", sql)
                    account = self.accounts.get(params[0])
                cursor.fetchone.return_value = deepcopy(account)

            cursor.execute.side_effect = execute
            yield cursor

        self.login_db = self.enterContext(patch("login.db_cursor", side_effect=fake_cursor))
        self.auth_db = self.enterContext(patch("auth.decorators.db_cursor", side_effect=fake_cursor))
        self.client = self.app.test_client()

    def csrf_token(self, client=None):
        response = (client or self.client).get("/csrf")
        self.assertEqual(response.status_code, 200)
        return response.get_json()["csrf_token"]

    def login(self, re_value="ADMIN-FIXTURE", password=None):
        return self.client.post(
            "/login",
            json={"re": re_value, "senha": self.password if password is None else password},
            headers={"X-CSRF-Token": self.csrf_token()},
        )

    def test_csrf_bootstrap_is_public_and_stable(self):
        first = self.csrf_token()
        self.assertGreaterEqual(len(first), 40)
        self.assertEqual(self.csrf_token(), first)
        self.assertEqual(self.client.get("/me").status_code, 401)
        self.assertEqual(self.csrf_token(), first)
        self.login_db.assert_not_called()
        self.auth_db.assert_not_called()

    def test_login_requires_csrf_before_processing_credentials(self):
        for headers in ({}, {"X-CSRF-Token": "invalid"}):
            with self.subTest(headers=headers):
                result = self.client.post(
                    "/login", json={"re": "ADMIN-FIXTURE", "senha": self.password}, headers=headers,
                )
                self.assertEqual(result.status_code, 403)
                self.assertNotIn("Set-Cookie", result.headers)
        self.login_db.assert_not_called()

    def test_login_rejects_wrong_csrf_for_existing_session(self):
        self.csrf_token()
        response = self.client.post(
            "/login", json={"re": "ADMIN-FIXTURE", "senha": self.password},
            headers={"X-CSRF-Token": "invalid"},
        )
        self.assertEqual(response.status_code, 403)
        self.login_db.assert_not_called()

    def test_admin_and_collaborator_login_return_current_profile(self):
        for account in self.accounts.values():
            with self.subTest(role=account["nivel_acesso"]):
                response = self.login(account["re"])
                self.assertEqual(response.status_code, 200)
                body = response.get_json()
                self.assertTrue(body["success"])
                self.assertEqual(body["colaborador"]["nivel_acesso"], account["nivel_acesso"])
                self.assertEqual(set(body["colaborador"]), {"id", "re", "nome", "nivel_acesso"})
                self.assertNotIn(self.password_hash, response.get_data(as_text=True))
                self.assertNotIn(self.password, response.get_data(as_text=True))

    def test_login_rotates_token_and_removes_previous_session_data(self):
        old_token = self.csrf_token()
        with self.client.session_transaction() as current:
            current["old_data"] = "discard"
        response = self.login()
        new_token = response.get_json()["csrf_token"]
        self.assertNotEqual(old_token, new_token)
        with self.client.session_transaction() as current:
            self.assertEqual(set(current), {"colaborador_id", "csrf_token"})
            self.assertEqual(current["colaborador_id"], 1)
        result = self.client.post("/logout", headers={"X-CSRF-Token": old_token})
        self.assertEqual(result.status_code, 403)
        self.assertEqual(self.client.get("/me").status_code, 200)

    def test_cookie_has_httponly_and_samesite_lax(self):
        response = self.login()
        cookie = response.headers["Set-Cookie"]
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Lax", cookie)
        self.assertNotIn("; Secure", cookie)
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_secure_cookie_when_app_is_configured_for_production(self):
        self.app.config["SESSION_COOKIE_SECURE"] = True
        response = self.client.get("/csrf", base_url="https://localhost")
        self.assertIn("; Secure", response.headers["Set-Cookie"])

    def test_login_query_is_parameterized_and_uses_only_re(self):
        response = self.login("  ADMIN-FIXTURE  ")
        self.assertEqual(response.status_code, 200)
        sql, params = self.queries[-1]
        self.assertIn("WHERE re = %s", sql)
        self.assertNotIn("email", sql.lower())
        self.assertEqual(params, ("ADMIN-FIXTURE",))
        response = self.login("' OR 1=1 --")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.queries[-1][1], ("' OR 1=1 --",))

    def test_email_login_is_rejected_without_querying_database(self):
        self.accounts[1]["re"] = "alguem@example.com"
        response = self.login("alguem@example.com")
        self.assertEqual(response.status_code, 401)
        self.login_db.assert_not_called()

    def test_wrong_password_and_missing_account_share_generic_error(self):
        wrong = self.login(password="senha incorreta")
        unknown = self.login("NAO-EXISTE")
        self.assertEqual(wrong.status_code, 401)
        self.assertEqual(unknown.status_code, 401)
        self.assertEqual(wrong.get_json(), unknown.get_json())

    def test_empty_or_oversized_credentials_are_rejected_without_database(self):
        for re_value, password in (("", "senha"), (" " * 3, "senha"), ("x" * 21, "senha"), ("ADMIN-FIXTURE", "")):
            with self.subTest(re_value=re_value):
                self.assertEqual(self.login(re_value, password).status_code, 401)
        self.login_db.assert_not_called()

    def test_inactive_unactivated_missing_hash_and_invalid_profile_are_blocked(self):
        original = deepcopy(self.accounts[1])
        for field, value in (("ativo", 0), ("conta_ativada", 0), ("senha_hash", None), ("senha_hash", ""), ("nivel_acesso", "superuser")):
            with self.subTest(field=field, value=value):
                self.accounts[1] = {**original, field: value}
                self.assertEqual(self.login().status_code, 403)
                with self.client.session_transaction() as current:
                    self.assertNotIn("colaborador_id", current)

    def test_malformed_password_hash_does_not_raise_server_error(self):
        self.accounts[1]["senha_hash"] = "unsupported$salt$hash"
        self.assertEqual(self.login().status_code, 401)

    def test_malformed_json_and_non_string_credentials_are_bad_request(self):
        token = self.csrf_token()
        headers = {"X-CSRF-Token": token}
        bad_bodies = (None, [], "text", {}, {"re": 123, "senha": "abc"}, {"re": "abc", "senha": []})
        for body in bad_bodies:
            with self.subTest(body=body):
                response = self.client.post("/login", json=body, headers=headers)
                self.assertEqual(response.status_code, 400)
        response = self.client.post("/login", data="{", content_type="application/json", headers=headers)
        self.assertEqual(response.status_code, 400)
        self.login_db.assert_not_called()

    def test_me_is_unauthorized_without_session(self):
        self.assertEqual(self.client.get("/me").status_code, 401)
        self.assertEqual(self.client.get("/protected-probe").status_code, 401)
        self.assertEqual(self.client.get("/admin-probe").status_code, 401)
        self.auth_db.assert_not_called()

    def test_me_reads_current_profile_and_preserves_csrf_after_reload(self):
        response = self.login("COLAB-FIXTURE")
        token = response.get_json()["csrf_token"]
        self.accounts[2]["nome"] = "Nome atualizado no banco"
        me = self.client.get("/me")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()["nivel_acesso"], "colaborador")
        self.assertEqual(me.get_json()["nome"], "Nome atualizado no banco")
        self.assertEqual(me.get_json()["csrf_token"], token)
        self.assertEqual(set(me.get_json()), {"id", "re", "nome", "nivel_acesso", "csrf_token"})
        self.assertEqual(self.queries[-1][1], (2,))

    def test_admin_allowed_and_collaborator_denied(self):
        self.login()
        self.assertEqual(self.client.get("/admin-probe").status_code, 200)
        self.login("COLAB-FIXTURE")
        self.assertEqual(self.client.get("/admin-probe").status_code, 403)
        self.assertEqual(self.client.get("/protected-probe").status_code, 200)

    def test_demotion_is_effective_on_next_admin_request(self):
        self.login()
        self.assertEqual(self.client.get("/admin-probe").status_code, 200)
        self.accounts[1]["nivel_acesso"] = "colaborador"
        self.assertEqual(self.client.get("/admin-probe").status_code, 403)
        self.assertEqual(self.client.get("/me").get_json()["nivel_acesso"], "colaborador")

    def test_disabled_account_invalidates_session_immediately(self):
        self.login()
        self.accounts[1]["ativo"] = 0
        self.assertEqual(self.client.get("/admin-probe").status_code, 403)
        self.assertEqual(self.client.get("/me").status_code, 401)
        with self.client.session_transaction() as current:
            self.assertEqual(dict(current), {})

    def test_unactivated_account_or_missing_hash_invalidates_session(self):
        original = deepcopy(self.accounts[1])
        for field, value in (("conta_ativada", 0), ("senha_hash", None), ("senha_hash", 123), ("nivel_acesso", "invalid")):
            with self.subTest(field=field):
                self.accounts[1] = {**original, field: value}
                with self.client.session_transaction() as current:
                    current["colaborador_id"] = 1
                self.assertEqual(self.client.get("/me").status_code, 403)
                with self.client.session_transaction() as current:
                    self.assertEqual(dict(current), {})

    def test_deleted_account_invalidates_session(self):
        self.login()
        del self.accounts[1]
        self.assertEqual(self.client.get("/me").status_code, 401)
        with self.client.session_transaction() as current:
            self.assertEqual(dict(current), {})

    def test_invalid_session_id_does_not_query_database(self):
        for value in ("1", 0, -1, True, [], {}):
            with self.subTest(value=value):
                with self.client.session_transaction() as current:
                    current["colaborador_id"] = value
                self.assertEqual(self.client.get("/me").status_code, 401)
        self.auth_db.assert_not_called()

    def test_all_writes_require_csrf_and_valid_token_reaches_view(self):
        token = self.login().get_json()["csrf_token"]
        for method in ("POST", "PUT", "PATCH", "DELETE"):
            for headers in ({}, {"X-CSRF-Token": "invalid"}):
                with self.subTest(method=method, headers=headers):
                    before = len(self.queries)
                    response = self.client.open("/mutation-probe", method=method, headers=headers)
                    self.assertEqual(response.status_code, 403)
                    self.assertEqual(len(self.queries), before)
            self.assertEqual(
                self.client.open("/mutation-probe", method=method, headers={"X-CSRF-Token": token}).status_code,
                200,
            )
        self.assertEqual(len(self.mutations), 4)

    def test_csrf_from_another_client_is_rejected(self):
        self.csrf_token()
        other_token = self.csrf_token(self.app.test_client())
        response = self.client.post("/logout", headers={"X-CSRF-Token": other_token})
        self.assertEqual(response.status_code, 403)

    def test_logout_requires_csrf_then_expires_cookie(self):
        token = self.login().get_json()["csrf_token"]
        self.assertEqual(self.client.post("/logout").status_code, 403)
        self.assertEqual(self.client.get("/me").status_code, 200)
        response = self.client.post("/logout", headers={"X-CSRF-Token": token})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["success"])
        self.assertIn("Max-Age=0", response.headers["Set-Cookie"])
        self.assertEqual(self.client.get("/me").status_code, 401)
        self.assertEqual(self.client.post("/logout", headers={"X-CSRF-Token": token}).status_code, 403)

    def test_login_database_failure_is_generic_service_unavailable(self):
        self.login_db.side_effect = DatabaseError("sensitive connection details")
        response = self.login()
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("sensitive", response.get_data(as_text=True))

    def test_me_database_failure_is_generic_service_unavailable(self):
        self.login()
        self.auth_db.side_effect = RuntimeError("sensitive connection details")
        response = self.client.get("/me")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("sensitive", response.get_data(as_text=True))

    def test_activation_routes_are_not_exposed_in_this_stage(self):
        self.assertEqual(self.client.get("/validar-token").status_code, 404)
        response = self.client.post("/definir-senha", json={}, headers={"X-CSRF-Token": self.csrf_token()})
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
