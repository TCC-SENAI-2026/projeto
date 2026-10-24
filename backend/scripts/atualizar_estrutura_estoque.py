"""Prepara a atualização aditiva do estoque; só altera o banco com --aplicar.

Uso na raiz: .venv/Scripts/python.exe backend/scripts/atualizar_estrutura_estoque.py
Repetir com --aplicar executa apenas colunas/vínculos/sementes ainda ausentes.
DDL do MySQL confirma alterações individualmente; faça backup antes de aplicar.
"""

import argparse
from pathlib import Path
import sys

import mysql.connector

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import load_config


COLUNAS = {
    'estoque': {
        'catalogo_item_id': 'INT UNSIGNED NULL',
        'imagem_mime': 'VARCHAR(50) NULL',
        'imagem_dados': 'MEDIUMBLOB NULL',
    },
    'pedido_itens': {
        'imagem_mime': 'VARCHAR(50) NULL',
        'imagem_dados': 'MEDIUMBLOB NULL',
        'estoque_id': 'INT UNSIGNED NULL',
    },
}
VINCULOS = (
    ('estoque', 'fk_estoque_catalogo_item', 'catalogo_item_id', 'catalogo_itens'),
    ('pedido_itens', 'fk_pedido_itens_estoque', 'estoque_id', 'estoque'),
)
MODELOS = ('Camiseta', 'Camisa', 'Camisa Longa', 'Moletom c/ Capuz', 'Calça')


def planejar(cursor):
    plano = []
    for tabela, colunas in COLUNAS.items():
        cursor.execute(
            'SELECT COLUMN_NAME FROM information_schema.columns '
            'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s', (tabela,)
        )
        existentes = {r['COLUMN_NAME'] for r in cursor.fetchall()}
        if not existentes:
            raise RuntimeError(f'Tabela {tabela} ausente. Este script exige o banco existente.')
        novas = [f'ADD COLUMN {nome} {tipo}' for nome, tipo in colunas.items() if nome not in existentes]
        if novas:
            plano.append((f'ALTER TABLE {tabela} ' + ', '.join(novas), ()))
    for tabela, nome, coluna, alvo in VINCULOS:
        cursor.execute(
            'SELECT CONSTRAINT_NAME FROM information_schema.table_constraints '
            'WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = %s AND CONSTRAINT_NAME = %s',
            (tabela, nome),
        )
        if not cursor.fetchone():
            plano.append((f'ALTER TABLE {tabela} ADD CONSTRAINT {nome} FOREIGN KEY ({coluna}) '
                          f'REFERENCES {alvo}(id) ON DELETE RESTRICT ON UPDATE RESTRICT', ()))
    for modelo in MODELOS:
        cursor.execute("SELECT id FROM catalogo_itens WHERE tipo = 'produto' AND nome = %s", (modelo,))
        if not cursor.fetchone():
            plano.append(("INSERT INTO catalogo_itens (tipo, nome, ativo) VALUES ('produto', %s, 1)", (modelo,)))
    return plano


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--aplicar', action='store_true')
    args = parser.parse_args()
    cfg = load_config()
    conn = mysql.connector.connect(
        host=cfg['DB_HOST'], port=cfg['DB_PORT'], user=cfg['DB_USER'],
        password=cfg['DB_PASSWORD'], database=cfg['DB_NAME'],
        connection_timeout=cfg['DB_CONNECT_TIMEOUT'],
    )
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)
        try:
            plano = planejar(cursor)
            print(f'{len(plano)} operações pendentes. ' + ('Aplicando.' if args.aplicar else 'Somente leitura.'))
            for sql, params in plano:
                print(sql, params)
                if args.aplicar:
                    cursor.execute(sql, params)
            if args.aplicar:
                conn.commit()
            else:
                conn.rollback()
        finally:
            cursor.close()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    main()
