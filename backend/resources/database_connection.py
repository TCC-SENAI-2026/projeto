import mysql.connector

def open_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='dev@2025',
        database='ethreads_db'
        )