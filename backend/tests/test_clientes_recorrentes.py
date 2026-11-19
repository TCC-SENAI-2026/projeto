import sys
from pathlib import Path
import sqlite3
import unittest
from contextlib import contextmanager
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from flask import Flask
from clientes import listar_clientes

class Recorrencia(unittest.TestCase):
    def test_limite_email_status_e_cadastro_manual(self):
        conn = sqlite3.connect(':memory:')
        conn.row_factory = sqlite3.Row
        conn.executescript('''
        CREATE TABLE clientes(id INTEGER, nome TEXT, email TEXT, telefone TEXT, endereco TEXT, logo_url TEXT, ativo INTEGER, cadastro_manual INTEGER);
        CREATE TABLE pedidos(cliente_id INTEGER, status TEXT);
        INSERT INTO clientes VALUES(1,'Manual',NULL,NULL,NULL,NULL,1,1);
        INSERT INTO clientes VALUES(2,'Recorrente',' Pessoa@EXEMPLO.com ',NULL,NULL,NULL,1,0);
        INSERT INTO clientes VALUES(3,'Outro nome','pessoa@exemplo.com',NULL,NULL,NULL,1,0);
        INSERT INTO clientes VALUES(4,'Sem email',NULL,NULL,NULL,NULL,1,0);
        ALTER TABLE clientes ADD COLUMN responsavel TEXT;
        ALTER TABLE clientes ADD COLUMN cpf_cnpj TEXT;
        INSERT INTO pedidos VALUES(2,'concluido'),(2,'concluido'),(3,'concluido'),(3,'concluido'),(2,'pendente'),(2,'cancelado');
        ''')
        @contextmanager
        def cursor():
            yield conn.cursor()
        app = Flask(__name__)
        with app.test_request_context(), patch('clientes.db_cursor', cursor):
            def ids():
                return {item[13] for item in listar_clientes.__wrapped__().get_json()}
            self.assertEqual(ids(), {1})
            conn.execute("INSERT INTO pedidos VALUES(3,'concluido')")
            self.assertEqual(ids(), {1,2,3})
            conn.executemany("INSERT INTO pedidos VALUES(4,'concluido')", [()]*5)
            self.assertEqual(ids(), {1,2,3})
        conn.close()

if __name__ == '__main__':
    unittest.main()
