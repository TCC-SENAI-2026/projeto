"""Pool criado apenas na primeira consulta; iniciar o Flask não conecta ao banco."""

from contextlib import contextmanager
from threading import Lock

from flask import current_app
from mysql.connector import InterfaceError
from mysql.connector.pooling import MySQLConnectionPool


def init_db(app):
    """Cada aplicação possui seu pool e lock, inclusive nas instâncias de teste."""
    app.extensions['database'] = {'pool': None, 'lock': Lock()}


def open_connection():
    """Obtém conexão do pool. close() a devolve ao pool para reutilização."""
    state = current_app.extensions['database']
    with state['lock']:
        if state['pool'] is None:
            config = current_app.config
            if not config['DB_USER'] or config['DB_PASSWORD'] is None:
                raise InterfaceError('Configure DB_USER e DB_PASSWORD no ambiente local.')
            state['pool'] = MySQLConnectionPool(
                pool_name='ethreads',
                pool_size=config['DB_POOL_SIZE'],
                pool_reset_session=True,
                host=config['DB_HOST'],
                port=config['DB_PORT'],
                user=config['DB_USER'],
                password=config['DB_PASSWORD'],
                database=config['DB_NAME'],
                connection_timeout=config['DB_CONNECT_TIMEOUT'],
                charset='utf8mb4',
                autocommit=False,
            )
        pool = state['pool']
    return pool.get_connection()


@contextmanager
def db_cursor(*, commit=False):
    """Entrega campos nomeados e fecha recursos mesmo quando a consulta falha.

    Leituras encerram a transação com rollback. Escritas só confirmam quando
    todo o bloco termina sem erro e o chamador optou por commit=True.
    """
    connection = open_connection()
    cursor = None
    try:
        cursor = connection.cursor(dictionary=True, buffered=True)
        yield cursor
        if commit:
            connection.commit()
        else:
            connection.rollback()
    except Exception:
        connection.rollback()
        raise
    finally:
        try:
            if cursor is not None:
                cursor.close()
        finally:
            connection.close()
