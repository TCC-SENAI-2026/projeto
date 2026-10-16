"""Compatibilidade dos módulos existentes com a conexão central sem credenciais.

Os módulos de negócio mantêm seus cursores e consultas até as tarefas próprias
de integração. Código novo deve preferir database.connection.db_cursor.
"""

from database.connection import open_connection

__all__ = ['open_connection']
