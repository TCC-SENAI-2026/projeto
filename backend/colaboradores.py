from flask import Blueprint, request, jsonify
import mysql.connector
from resources.database_connection import open_connection
import resources.database_connection as database_connection

colaboradores_bp = Blueprint('colaboradores', __name__)

##GET busca 
##POST insere

##GET para buscar os colaboradores cadastrados no banco de dados
@colaboradores_bp.route('/colaboradores', methods=['POST'])
def cadastro_colaboradores():
    if request.method == 'POST':

        nome_completo = request.form['nome_completo']
        re = request.form['re']
        cpf = request.form['cpf']
        data_nascimento = request.form['data_nascimento']
        telefone = request.form['telefone']
        email = request.form['email']
        endereco = request.form['endereco']
        data_contratacao = request.form['data_contratacao']
        salario = request.form['salario']
        nivel_acesso = request.form['nivel_acesso']
        senha_hash = request.form['senha_hash']
        observacoes = request.form['observacoes']
        ativo = request.form['ativo']

        connection = database_connection.open_connection()
        cursor = connection.cursor()

        SQL = """
        INSERT INTO colaboradores 
        (nome_completo, re, cpf, data_nascimento, telefone, email,
        endereco, data_contratacao, salario, nivel_acesso, senha_hash,
        observacoes, ativo)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        values = (nome_completo, re, cpf, data_nascimento, telefone, email,
        endereco, data_contratacao, salario, nivel_acesso, senha_hash,
        observacoes, ativo)

        cursor.execute(SQL, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Colaborador cadastrado com sucesso!'})
    return render_template('../pages/Equipe.jsx')


@colaboradores_bp.route('/listar_colaboradores', methods=['GET'])
def listar_colaboradores():
    connection = database_connection.open_connection()
    cursor = connection.cursor()

    SQL = """
    SELECT nome_completo, re, cpf, data_nascimento, telefone, email,
    endereco, data_contratacao, salario, nivel_acesso, observacoes
    FROM colaboradores WHERE ativo = 1;
    """
    cursor.execute(SQL)

    ##fetchall, para ele retornar todos os resultados da consulta, ou seja, a lista de colaboradores ativos no banco de dados.
    colaboradores = cursor.fetchall()

    cursor.close()
    connection.close()

    return render_template('../pages/Equipe.jsx', colaboradores=colaboradores)