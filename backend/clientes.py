import os
import re
import uuid

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from auth.decorators import login_required
from database.connection import db_cursor

# Segurança (mesmo padrão do login.py):
#  - @login_required em cada rota: exige sessão válida, conta ativa e perfil conhecido,
#    lidos do banco a cada requisição (auth/decorators.py).
#  - Todo POST/PUT/PATCH/DELETE exige o cabeçalho X-CSRF-Token (auth/csrf.py, global).

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
EXTENSOES_LOGO = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}

clientes_bp = Blueprint('clientes', __name__)

# A tabela clientes do schema novo guarda: nome, email, telefone, endereco, logo_url e ativo.
# O formulário do front ainda envia mais campos (responsável, CPF/CNPJ, observações e o endereço
# separado em cep/rua/número/município/estado). O endereço separado é gravado em UMA coluna
# (endereco) num formato fixo e separado de volta ao listar; responsável, CPF/CNPJ e
# observações não têm coluna no schema e por isso não são gravados.
PADRAO_ENDERECO = re.compile(
    r'^(?P<rua>.+?), (?P<numero>[^,]+?) - (?P<municipio>.+?)/(?P<estado>[A-Z]{2})'
    r'(?: - CEP (?P<cep>[\d-]+))?$'
)


def texto(nome):
    """Campo de formulário sem espaços nas pontas; vazio vira None."""
    valor = (request.form.get(nome) or '').strip()
    return valor or None


def montar_endereco(rua, numero, municipio, estado, cep):
    if rua and numero and municipio and estado:
        endereco = f'{rua}, {numero} - {municipio}/{estado.upper()}'
        return f'{endereco} - CEP {cep}' if cep else endereco
    partes = [parte for parte in (rua, numero, municipio, estado, cep) if parte]
    return ', '.join(partes) or None


def separar_endereco(endereco):
    """Inverso de montar_endereco. Endereço fora do padrão vai inteiro no campo rua."""
    vazio = {'rua': '', 'numero': '', 'municipio': '', 'estado': '', 'cep': ''}
    if not endereco:
        return vazio
    achado = PADRAO_ENDERECO.match(endereco)
    if not achado:
        return {**vazio, 'rua': endereco}
    return {chave: valor or '' for chave, valor in achado.groupdict().items()}


def linha_para_front(cliente):
    """O front lê cada cliente como lista, nesta ordem (Clientes.jsx / FormCliente.jsx):
    0 nome, 1 responsável, 2 cpf/cnpj, 3 telefone, 4 e-mail, 5 cep, 6 rua, 7 número,
    8 município, 9 estado, 10 observações, 11 logo, 12 ativo, 13 id."""
    ender = separar_endereco(cliente['endereco'])
    return [
        cliente['nome'], '', '', cliente['telefone'] or '', cliente['email'] or '',
        ender['cep'], ender['rua'], ender['numero'], ender['municipio'], ender['estado'],
        '', cliente['logo_url'] or '', cliente['ativo'], cliente['id'],
    ]


def ler_formulario():
    return {
        'nome':     (request.form.get('nome_empresa') or '').strip(),
        'telefone': texto('telefone'),
        'email':    texto('email'),
        'endereco': montar_endereco(texto('rua'), texto('numero'), texto('municipio'),
                                    texto('estado'), texto('cep')),
        'ativo':    1 if request.form.get('status') == 'ativo' else 0,
    }


def validar_dados(dados):
    if not dados['nome']:
        return 'Informe o nome da empresa.'
    limites = (('nome', 150, 'O nome'), ('email', 254, 'O e-mail'),
               ('telefone', 20, 'O telefone'), ('endereco', 255, 'O endereço'))
    for campo, maximo, rotulo in limites:
        if dados[campo] and len(dados[campo]) > maximo:
            return f'{rotulo} pode ter no máximo {maximo} caracteres.'
    return None


def salvar_logo():
    """Salva o arquivo enviado e devolve o nome gravado, None se não houve arquivo.
    Levanta ValueError com a mensagem para o usuário se o arquivo for inválido."""
    arquivo = request.files.get('foto_logo')
    if not arquivo or not arquivo.filename:
        return None
    nome_seguro = secure_filename(arquivo.filename)
    extensao = os.path.splitext(nome_seguro)[1].lower()
    if extensao not in EXTENSOES_LOGO:
        raise ValueError('Envie a logo em PNG, JPG, GIF ou WEBP.')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    nome_final = f'{uuid.uuid4().hex[:8]}_{nome_seguro}'
    arquivo.save(os.path.join(UPLOAD_FOLDER, nome_final))
    return nome_final


@clientes_bp.route('/cadastrar-cliente', methods=['GET', 'POST'])
@login_required
def cadastrar_cliente():
    if request.method != 'POST':
        return jsonify({'status': 'ok'})

    dados = ler_formulario()
    erro = validar_dados(dados)
    if erro:
        return jsonify({'status': 'erro', 'msg': erro}), 400

    try:
        logo = salvar_logo()
    except ValueError as erro_arquivo:
        return jsonify({'status': 'erro', 'msg': str(erro_arquivo)}), 400

    with db_cursor(commit=True) as cursor:
        cursor.execute("""
            INSERT INTO clientes (nome, email, telefone, endereco, logo_url, ativo)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (dados['nome'], dados['email'], dados['telefone'], dados['endereco'], logo, dados['ativo']))

    return jsonify({'status': 'ok'})


@clientes_bp.route('/listar-clientes', methods=['GET'])
@login_required
def listar_clientes():
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT id, nome, email, telefone, endereco, logo_url, ativo
            FROM clientes
            WHERE ativo = 1
            ORDER BY nome;
        """)
        clientes = cursor.fetchall()
    return jsonify([linha_para_front(cliente) for cliente in clientes])


@clientes_bp.route('/editar-cliente/<int:id_cliente>', methods=['GET', 'POST'])
@login_required
def editar_cliente(id_cliente):
    if request.method == 'POST':
        dados = ler_formulario()
        erro = validar_dados(dados)
        if erro:
            return jsonify({'status': 'erro', 'msg': erro}), 400

        try:
            logo = salvar_logo()
        except ValueError as erro_arquivo:
            return jsonify({'status': 'erro', 'msg': str(erro_arquivo)}), 400

        # Sem arquivo novo, mantém a logo que já está no banco (o front manda 'foto_atual',
        # mas o valor do banco é a fonte confiável).
        with db_cursor(commit=True) as cursor:
            cursor.execute("""
                UPDATE clientes
                SET nome = %s, email = %s, telefone = %s, endereco = %s,
                    logo_url = COALESCE(%s, logo_url), ativo = %s
                WHERE id = %s;
            """, (dados['nome'], dados['email'], dados['telefone'], dados['endereco'],
                  logo, dados['ativo'], id_cliente))

        return jsonify({'status': 'ok'})

    with db_cursor() as cursor:
        cursor.execute("""
            SELECT id, nome, email, telefone, endereco, logo_url, ativo
            FROM clientes WHERE id = %s;
        """, (id_cliente,))
        cliente = cursor.fetchone()

    if not cliente:
        return jsonify({'status': 'erro', 'msg': 'Cliente não encontrado.'}), 404

    return jsonify(linha_para_front(cliente))


@clientes_bp.route('/excluir-cliente/<int:id_cliente>', methods=['POST'])
@login_required
def excluir_cliente(id_cliente):
    # Exclusão lógica: pedidos continuam apontando para o cliente.
    with db_cursor(commit=True) as cursor:
        cursor.execute("UPDATE clientes SET ativo = 0 WHERE id = %s;", (id_cliente,))

    return jsonify({'status': 'ok'})
