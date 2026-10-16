"""Validação isolada dos scripts: nenhum INSERT real nem senha de usuário."""

import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.bootstrap_user import generate_available_re, insert_initial_user, main, read_password


class BootstrapTests(unittest.TestCase):
    def test_generated_re_preserves_leading_zero_and_retries_collision(self):
        cursor = MagicMock()
        cursor.fetchone.side_effect = [{'id': 1}, None]
        with patch('scripts.bootstrap_user.secrets.randbelow', side_effect=[42, 7]):
            self.assertEqual(generate_available_re(cursor), '0007')
        self.assertEqual(cursor.execute.call_args.args[1], ('0007',))

    def test_generated_re_fails_without_available_candidate(self):
        cursor = MagicMock()
        cursor.fetchone.return_value = {'id': 1}
        with self.assertRaises(ValueError):
            generate_available_re(cursor)

    def test_duplicate_role_email_and_re_never_insert(self):
        for rows in [[{'id': 1}], [None, {'id': 1}], [None, None, {'id': 1}]]:
            with self.subTest(rows=rows):
                cursor = MagicMock()
                cursor.fetchone.side_effect = rows
                with self.assertRaises(ValueError):
                    insert_initial_user(cursor, role='administrador', employee_re='0001',
                                        name='Teste', email='test@example.invalid', password_hash='hash-simulado')
                self.assertFalse(any('INSERT' in call.args[0] for call in cursor.execute.call_args_list))

    def test_both_profiles_insert_only_named_fields_and_enabled_flags(self):
        for role, initial_re in [('administrador', '0001'), ('colaborador', '0002')]:
            with self.subTest(role=role):
                cursor = MagicMock()
                cursor.fetchone.return_value = None
                with patch('scripts.bootstrap_user.generate_available_re') as generate_re:
                    result = insert_initial_user(cursor, role=role, employee_re=initial_re,
                                                 name='Teste', email='test@example.invalid', password_hash='hash-simulado')
                    generate_re.assert_not_called()
                sql, values = cursor.execute.call_args.args
                self.assertIn('senha_hash, ativo, conta_ativada', sql)
                self.assertIn('1, 1)', sql)
                self.assertEqual(values, (result, 'Teste', 'test@example.invalid', role, 'hash-simulado'))
                self.assertEqual(result, initial_re)
                self.assertEqual(len(result), 4)

    def test_both_profiles_prompt_manual_re_and_preserve_leading_zeros(self):
        # main é exercitado com terminal, senha, config, app e banco simulados;
        # nenhum .env, cursor SQL real ou script de criação é executado.
        for role in ('administrador', 'colaborador'):
            with self.subTest(role=role), \
                    patch('sys.argv', ['bootstrap-fixture']), \
                    patch('scripts.bootstrap_user.sys.stdin.isatty', return_value=True), \
                    patch('builtins.input', side_effect=['BANCO CRIADO', 'Teste', 'test@example.invalid', ' 0007 ']) as user_input, \
                    patch('builtins.print') as output, \
                    patch('scripts.bootstrap_user.read_password', return_value='hash-simulado') as password, \
                    patch('scripts.bootstrap_user.load_config', return_value={'FIXTURE': True}) as config, \
                    patch('scripts.bootstrap_user.Flask') as flask, \
                    patch('scripts.bootstrap_user.init_db') as init_db, \
                    patch('scripts.bootstrap_user.db_cursor') as db, \
                    patch('scripts.bootstrap_user.insert_initial_user', return_value='0007') as insert, \
                    patch('scripts.bootstrap_user.generate_available_re') as generate_re:
                cursor = db.return_value.__enter__.return_value
                cursor.fetchone.return_value = {'acquired': 1}

                self.assertEqual(main(role), 0)

                self.assertEqual(user_input.call_count, 4)
                self.assertEqual(user_input.call_args.args, (f'RE do {role} (4 dígitos): ',))
                password.assert_called_once_with()
                config.assert_called_once_with()
                flask.return_value.config.update.assert_called_once_with({'FIXTURE': True})
                init_db.assert_called_once_with(flask.return_value)
                db.assert_called_once_with(commit=True)
                insert.assert_called_once_with(
                    cursor, role=role, employee_re='0007', name='Teste',
                    email='test@example.invalid', password_hash='hash-simulado',
                )
                generate_re.assert_not_called()
                output.assert_any_call(f'Conta {role} criada. RE para login: 0007')

    def test_both_profiles_reject_invalid_manual_re_before_password_or_connection(self):
        invalid_res = ('007', '00007', '00a7', '+007', '-007', '٠٠٠٧', '０００７', '', '   ')
        for role in ('administrador', 'colaborador'):
            for employee_re in invalid_res:
                with self.subTest(role=role, employee_re=employee_re), \
                        patch('sys.argv', ['bootstrap-fixture']), \
                        patch('scripts.bootstrap_user.sys.stdin.isatty', return_value=True), \
                        patch('builtins.input', side_effect=['BANCO CRIADO', 'Teste', 'test@example.invalid', employee_re]) as user_input, \
                        patch('builtins.print'), \
                        patch('scripts.bootstrap_user.read_password') as password, \
                        patch('scripts.bootstrap_user.load_config') as config, \
                        patch('scripts.bootstrap_user.Flask') as flask, \
                        patch('scripts.bootstrap_user.init_db') as init_db, \
                        patch('scripts.bootstrap_user.db_cursor') as db, \
                        patch('scripts.bootstrap_user.insert_initial_user') as insert, \
                        patch('scripts.bootstrap_user.generate_available_re') as generate_re:
                    self.assertEqual(main(role), 1)
                    self.assertEqual(user_input.call_args.args, (f'RE do {role} (4 dígitos): ',))
                    password.assert_not_called()
                    config.assert_not_called()
                    flask.assert_not_called()
                    init_db.assert_not_called()
                    db.assert_not_called()
                    insert.assert_not_called()
                    generate_re.assert_not_called()

    def test_password_is_hashed_only_after_matching_hidden_inputs(self):
        with patch('scripts.bootstrap_user.getpass.getpass', side_effect=['senha-simulada', 'senha-simulada']), \
                patch('scripts.bootstrap_user.generate_password_hash', return_value='hash-simulado') as hash_password:
            self.assertEqual(read_password(), 'hash-simulado')
            hash_password.assert_called_once_with('senha-simulada')

    def test_short_or_mismatched_password_never_hashes(self):
        for inputs in [['curta', 'curta'], ['senha-simulada', 'outra-senha']]:
            with self.subTest(inputs=inputs), \
                    patch('scripts.bootstrap_user.getpass.getpass', side_effect=inputs), \
                    patch('scripts.bootstrap_user.generate_password_hash') as hash_password:
                with self.assertRaises(ValueError):
                    read_password()
                hash_password.assert_not_called()

    def test_noninteractive_invocation_never_connects(self):
        with patch('sys.argv', ['create_admin.py']), \
                patch('scripts.bootstrap_user.sys.stdin.isatty', return_value=False), \
                patch('scripts.bootstrap_user.db_cursor') as db:
            self.assertEqual(main('administrador'), 1)
            db.assert_not_called()

    def test_cancelled_confirmation_never_prompts_password_or_connects(self):
        with patch('sys.argv', ['create_admin.py']), \
                patch('scripts.bootstrap_user.sys.stdin.isatty', return_value=True), \
                patch('builtins.input', return_value='cancelar'), \
                patch('scripts.bootstrap_user.read_password') as password, \
                patch('scripts.bootstrap_user.db_cursor') as db:
            self.assertEqual(main('administrador'), 1)
            password.assert_not_called()
            db.assert_not_called()


if __name__ == '__main__':
    unittest.main()
