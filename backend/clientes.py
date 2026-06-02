from flask import Flask, request, render_template, url_for, redirect
import resources.database_connection as database_connection

app = Flask(__name__)
app.config['SECRET_KEY'] = 'chave_secreta'

@app.route('/')
def clientes():
    return redirect(url_for('listar_clientes'))

@app.route('/cadastrar-cliente', methods=['GET', 'POST'])
def cadastrar_cliente():

    if request.method == 'POST':
        empresa = request.form['empresa']
        responsavel = request.form['responsavel']
        cpf_cnpj = request.form['cpf_cnpj']
        telefone = request.form['telefone']
        email = request.form['email']
        cep = request.form['cep']
        rua = request.form['rua']
        numero = request.form['numero']
        municipio = request.form['municipio']
        estado = request.form['estado']
        observacoes = request.form['observacoes']
        foto_logo = request.files['foto_logo']
        ativo = request.form.get('ativo') == 'on'

        conn = database_connection.open_connection()
        cursor = conn.cursor()

        SQL = """
            INSERT INTO clientes ()
        """