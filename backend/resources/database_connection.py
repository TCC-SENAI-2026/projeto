import mysql.connector

def open_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='1234',
        database='ethreads_db'
        )