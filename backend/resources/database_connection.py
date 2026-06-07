import mysql.connector

def open_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='root',
        database='ethreads_db'
        )