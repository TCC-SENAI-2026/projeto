from flask import Blueprint, request, jsonify, redirect, url_for
import os
import resources.database_connection as database_connection

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')

clientes_bp = Blueprint('clientes', __name__)

@clientes_bp.route('/cadastrar-cliente', methods=['GET', 'POST'])
def cadastrar_cliente():
    if request.method == 'POST':
        nome_empresa = request.form['nome_empresa']
        responsavel  = request.form['responsavel']
        cpf_cnpj     = request.form['cpf_cnpj']
        telefone     = request.form['telefone']
        email        = request.form['email']
        cep          = request.form['cep']
        rua          = request.form['rua']
        numero       = request.form['numero']
        municipio    = request.form['municipio']
        estado       = request.form['estado']
        observacoes  = request.form['observacoes']
        foto_logo    = request.files.get('foto_logo')
        ativo        = 1 if request.form.get('status') == 'ativo' else 0

        foto_nome = None
        if foto_logo and foto_logo.filename != '':
            foto_nome = foto_logo.filename
            foto_logo.save(os.path.join(UPLOAD_FOLDER, foto_nome))

        conn = database_connection.open_connection()
        cursor = conn.cursor()

        SQL = """
            INSERT INTO clientes 
                (nome_empresa, responsavel, cpf_cnpj, telefone, email,
                cep, rua, numero, municipio, estado, observacoes, foto_logo, ativo)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.execute(SQL, (nome_empresa, responsavel, cpf_cnpj, telefone, email,
            cep, rua, numero, municipio, estado, observacoes, foto_nome, ativo))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'status': 'ok'})

    return jsonify({'status': 'ok'})


@clientes_bp.route('/listar-clientes', methods=['GET'])
def listar_clientes():
    conn = database_connection.open_connection()
    cursor = conn.cursor()

    SQL = """
        SELECT nome_empresa, responsavel, cpf_cnpj, telefone, email,
               cep, rua, numero, municipio, estado, observacoes, foto_logo, ativo,
               id_cliente
        FROM clientes
        WHERE ativo = 1;
    """
    cursor.execute(SQL)
    clientes = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(clientes)


@clientes_bp.route('/editar-cliente/<int:id_cliente>', methods=['GET', 'POST'])
def editar_cliente(id_cliente):
    conn = database_connection.open_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        nome_empresa = request.form['nome_empresa']
        responsavel  = request.form['responsavel']
        cpf_cnpj     = request.form['cpf_cnpj']
        telefone     = request.form['telefone']
        email        = request.form['email']
        cep          = request.form['cep']
        rua          = request.form['rua']
        numero       = request.form['numero']
        municipio    = request.form['municipio']
        estado       = request.form['estado']
        observacoes  = request.form['observacoes']
        foto_logo    = request.files.get('foto_logo')
        ativo        = 1 if request.form.get('status') == 'ativo' else 0

        foto_nome = request.form.get('foto_atual')
        print('FOTO ATUAL RECEBIDA:', foto_nome)
        if foto_logo and foto_logo.filename != '':
            foto_nome = foto_logo.filename
            foto_logo.save(os.path.join(UPLOAD_FOLDER, foto_nome))

        SQL = """
            UPDATE clientes
            SET nome_empresa = %s, responsavel = %s, cpf_cnpj = %s, telefone = %s, email = %s,
                cep = %s, rua = %s, numero = %s, municipio = %s, estado = %s, observacoes = %s,
                foto_logo = %s, ativo = %s
            WHERE id_cliente = %s;
        """
        cursor.execute(SQL, (nome_empresa, responsavel, cpf_cnpj, telefone, email,
            cep, rua, numero, municipio, estado, observacoes, foto_nome, ativo, id_cliente))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'status': 'ok'})

    SQL = """
        SELECT nome_empresa, responsavel, cpf_cnpj, telefone, email,
               cep, rua, numero, municipio, estado, observacoes, foto_logo, ativo
        FROM clientes WHERE id_cliente = %s;
    """
    cursor.execute(SQL, (id_cliente,))
    cliente = cursor.fetchone()
    cursor.close()
    conn.close()

    return jsonify(cliente)


@clientes_bp.route('/excluir-cliente/<int:id_cliente>', methods=['POST'])
def excluir_cliente(id_cliente):
    conn = database_connection.open_connection()
    cursor = conn.cursor()

    SQL = "UPDATE clientes SET ativo = 0 WHERE id_cliente = %s;"
    cursor.execute(SQL, (id_cliente,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 'ok'})