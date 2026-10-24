from flask import Blueprint, request, jsonify
import mysql.connector

from auth.decorators import admin_required
from database.connection import db_cursor
import resources.email_service as email_service
import resources.seguranca as seguranca

# Segurança (mesmo padrão do login.py):
#  - @admin_required em cada rota: exige sessão válida e perfil administrador, lidos do banco
#    a cada requisição (auth/decorators.py). O app.py já protege o blueprint inteiro; o
#    decorator explícito mantém a rota segura mesmo se essa proteção global mudar.
#  - Todo POST/PUT/PATCH/DELETE exige o cabeçalho X-CSRF-Token (auth/csrf.py, global).

colaboradores_bp = Blueprint('colaboradores', __name__)

PREFERENCIAS_NOTIFICACAO = ('email', 'sms', 'ambos')

# O banco usa 'administrador'/'colaborador'. O front atual (Equipe.jsx/FormUsuario.jsx) ainda
# fala 'administrativo'/'padrao' (TODO(BACK) no código dele). Esta camada traduz nos dois
# sentidos para o front funcionar sem alteração; o banco guarda sempre o valor do schema.
NIVEL_DO_FRONT = {
    'administrativo': 'administrador', 'padrao': 'colaborador',
    'administrador': 'administrador', 'colaborador': 'colaborador',
}
NIVEL_PARA_O_FRONT = {'administrador': 'administrativo', 'colaborador': 'padrao'}


def nivel_do_front(valor):
    """Valor do formulário -> valor do banco, ou None se vazio/inválido."""
    return NIVEL_DO_FRONT.get(valor)


def converter_salario(valor):
    if not valor:
        return None
    return valor.replace('.', '').replace(',', '.')


def formatar_salario(valor):
    """Decimal do banco -> texto no formato brasileiro, como o formulário espera."""
    if valor is None:
        return ''
    return f'{valor:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')


def vazio_para_none(valor):
    valor = valor.strip() if isinstance(valor, str) else valor
    return valor if valor else None


def validar_opcao(valor, opcoes, padrao):
    return valor if valor in opcoes else padrao


def validar_canais(preferencia, email, telefone):
    """O link de ativação precisa ter para onde ir."""
    if preferencia in ('email', 'ambos') and not email:
        return 'Informe um e-mail para receber o link de ativação.'
    if preferencia in ('sms', 'ambos') and not telefone:
        return 'Informe um telefone para receber o link de ativação.'
    return None


def mensagem_duplicidade(erro_db):
    """Traduz o erro de chave única do MySQL sem expor o texto bruto do banco."""
    texto = str(erro_db)
    if 'uq_colaboradores_re' in texto:
        return 'Já existe um colaborador com este RE.'
    if 'uq_colaboradores_cpf' in texto:
        return 'Já existe um colaborador com este CPF.'
    if 'uq_colaboradores_email' in texto:
        return 'Já existe um colaborador com este e-mail.'
    return 'Já existe um colaborador com estes dados (RE, CPF ou e-mail).'


def ler_formulario():
    """Lê os campos que o formulário do front envia (FormData)."""
    return {
        'nome':                     request.form.get('nome_completo', '').strip(),
        're':                       vazio_para_none(request.form.get('re')),
        'cpf':                      vazio_para_none(request.form.get('cpf')),
        'telefone':                 vazio_para_none(request.form.get('telefone')),
        'email':                    vazio_para_none(request.form.get('email')),
        'endereco':                 vazio_para_none(request.form.get('endereco')),
        'nivel_acesso':             nivel_do_front(request.form.get('nivel_acesso')),
        'data_contrato':            vazio_para_none(request.form.get('data_contratacao')),
        'salario':                  converter_salario(request.form.get('salario')),
        'preferencia_notificacoes': validar_opcao(request.form.get('preferencia_notificacoes'), PREFERENCIAS_NOTIFICACAO, 'email'),
        'ativo':                    1 if request.form.get('status') == 'ativo' else 0,
    }


def validar_dados(dados):
    """Campos obrigatórios e limites do schema novo. Devolve a mensagem de erro ou None."""
    if not dados['nome']:
        return 'Informe o nome do colaborador.'
    if len(dados['nome']) > 150:
        return 'O nome pode ter no máximo 150 caracteres.'
    if not dados['re']:
        return 'Informe o RE do colaborador.'
    if len(dados['re']) > 20:
        return 'O RE pode ter no máximo 20 caracteres.'
    if not dados['email']:
        return 'Informe o e-mail do colaborador.'
    if len(dados['email']) > 254:
        return 'O e-mail pode ter no máximo 254 caracteres.'
    return validar_canais(dados['preferencia_notificacoes'], dados['email'], dados['telefone'])


def criar_token_ativacao(cursor, colaborador_id):
    """Invalida links antigos e grava um novo. Só o hash do token vai para o banco."""
    token = seguranca.gerar_token()
    cursor.execute("""
        UPDATE tokens SET expira_em = NOW()
        WHERE colaborador_id = %s AND tipo = 'ativacao'
          AND usado_em IS NULL AND expira_em > NOW();
    """, (colaborador_id,))
    cursor.execute("""
        INSERT INTO tokens (colaborador_id, tipo, token_hash, expira_em)
        VALUES (%s, 'ativacao', %s, DATE_ADD(NOW(), INTERVAL 24 HOUR));
    """, (colaborador_id, seguranca.hash_token(token)))
    return token


@colaboradores_bp.route('/cadastrar-colaborador', methods=['GET', 'POST'])
@admin_required
def cadastrar_colaborador():
    if request.method != 'POST':
        return jsonify({'status': 'ok'})

    dados = ler_formulario()
    erro = validar_dados(dados)
    if erro:
        return jsonify({'status': 'erro', 'msg': erro}), 400

    # A conta nasce sem senha e não ativada (conta_ativada = 0). Ela só passa a
    # poder entrar depois que o colaborador definir a senha pelo link.
    SQL = """
        INSERT INTO colaboradores
            (re, nome, cpf, email, telefone, endereco, nivel_acesso,
             ativo, data_contrato, salario, preferencia_notificacoes, conta_ativada)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0);
    """
    try:
        with db_cursor(commit=True) as cursor:
            cursor.execute(SQL, (dados['re'], dados['nome'], dados['cpf'], dados['email'],
                dados['telefone'], dados['endereco'], dados['nivel_acesso'] or 'colaborador', dados['ativo'],
                dados['data_contrato'], dados['salario'], dados['preferencia_notificacoes']))
            token = criar_token_ativacao(cursor, cursor.lastrowid)
    except mysql.connector.IntegrityError as erro_db:
        print('ERRO DE INTEGRIDADE:', erro_db)
        return jsonify({'status': 'erro', 'msg': mensagem_duplicidade(erro_db)}), 409

    try:
        email_service.enviar_link_ativacao(dados['nome'], dados['email'], dados['telefone'],
            dados['preferencia_notificacoes'], token)
    except Exception as erro_envio:
        print('ERRO AO ENVIAR LINK DE ATIVACAO:', erro_envio)
        return jsonify({
            'status': 'ok',
            'aviso': 'Colaborador cadastrado, mas não foi possível enviar o link. Use o reenvio de link.'
        })

    return jsonify({'status': 'ok'})


@colaboradores_bp.route('/reenviar-link/<int:id_colaborador>', methods=['POST'])
@admin_required
def reenviar_link(id_colaborador):
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT nome, email, telefone, preferencia_notificacoes, conta_ativada
            FROM colaboradores
            WHERE id = %s AND ativo = 1;
        """, (id_colaborador,))
        colaborador = cursor.fetchone()

    if not colaborador:
        return jsonify({'status': 'erro', 'msg': 'Colaborador não encontrado.'}), 404

    if colaborador['conta_ativada']:
        return jsonify({'status': 'erro', 'msg': 'Este colaborador já definiu a senha.'}), 400

    erro = validar_canais(colaborador['preferencia_notificacoes'], colaborador['email'], colaborador['telefone'])
    if erro:
        return jsonify({'status': 'erro', 'msg': erro}), 400

    with db_cursor(commit=True) as cursor:
        token = criar_token_ativacao(cursor, id_colaborador)

    try:
        email_service.enviar_link_ativacao(colaborador['nome'], colaborador['email'],
            colaborador['telefone'], colaborador['preferencia_notificacoes'], token)
    except Exception as erro_envio:
        print('ERRO AO REENVIAR LINK DE ATIVACAO:', erro_envio)
        return jsonify({'status': 'erro', 'msg': 'Não foi possível enviar o link.'}), 500

    return jsonify({'status': 'ok'})


@colaboradores_bp.route('/listar-colaboradores', methods=['GET'])
@admin_required
def listar_colaboradores():
    # Só o que a tela de equipe precisa (sem CPF, salário, etc.). Os apelidos (AS)
    # mantêm os nomes de campo que o front já lê (id_colaborador, nome_completo).
    # senha_definida = 0 significa que o colaborador ainda não usou o link.
    SQL = """
        SELECT id AS id_colaborador, nome AS nome_completo, re, email, nivel_acesso,
               preferencia_notificacoes, ativo,
               (conta_ativada = 1) AS senha_definida
        FROM colaboradores
        WHERE ativo = 1
        ORDER BY nome;
    """
    with db_cursor() as cursor:
        cursor.execute(SQL)
        colaboradores = cursor.fetchall()

    for colaborador in colaboradores:
        colaborador['nivel_acesso'] = NIVEL_PARA_O_FRONT.get(colaborador['nivel_acesso'], colaborador['nivel_acesso'])

    return jsonify(colaboradores)


@colaboradores_bp.route('/alterar-nivel-acesso/<int:id_colaborador>', methods=['POST'])
@admin_required
def alterar_nivel_acesso(id_colaborador):
    data = request.get_json(silent=True) or {}
    nivel_acesso = nivel_do_front(data.get('nivel_acesso'))

    if nivel_acesso is None:
        return jsonify({'status': 'erro', 'msg': 'Nível de acesso inválido.'}), 400

    with db_cursor(commit=True) as cursor:
        cursor.execute("UPDATE colaboradores SET nivel_acesso = %s WHERE id = %s;",
            (nivel_acesso, id_colaborador))

    return jsonify({'status': 'ok'})


@colaboradores_bp.route('/editar-colaborador/<int:id_colaborador>', methods=['GET', 'POST'])
@admin_required
def editar_colaborador(id_colaborador):
    if request.method == 'POST':
        dados = ler_formulario()
        erro = validar_dados(dados)
        if erro:
            return jsonify({'status': 'erro', 'msg': erro}), 400

        SQL = """
            UPDATE colaboradores
            SET nome = %s, re = %s, cpf = %s, telefone = %s, email = %s,
                endereco = %s, nivel_acesso = COALESCE(%s, nivel_acesso), data_contrato = %s, salario = %s,
                preferencia_notificacoes = %s, ativo = %s
            WHERE id = %s;
        """
        try:
            with db_cursor(commit=True) as cursor:
                cursor.execute(SQL, (dados['nome'], dados['re'], dados['cpf'], dados['telefone'],
                    dados['email'], dados['endereco'], dados['nivel_acesso'], dados['data_contrato'],
                    dados['salario'], dados['preferencia_notificacoes'], dados['ativo'],
                    id_colaborador))
        except mysql.connector.IntegrityError as erro_db:
            print('ERRO DE INTEGRIDADE:', erro_db)
            return jsonify({'status': 'erro', 'msg': mensagem_duplicidade(erro_db)}), 409

        return jsonify({'status': 'ok'})

    # GET: devolve os dados para preencher o formulário de edição
    SQL = """
        SELECT nome AS nome_completo, re, cpf, telefone, email, endereco, nivel_acesso,
               data_contrato AS data_contratacao, salario, preferencia_notificacoes, ativo,
               (conta_ativada = 1) AS senha_definida
        FROM colaboradores WHERE id = %s;
    """
    with db_cursor() as cursor:
        cursor.execute(SQL, (id_colaborador,))
        colaborador = cursor.fetchone()

    if not colaborador:
        return jsonify({'status': 'erro', 'msg': 'Colaborador não encontrado.'}), 404

    colaborador['nivel_acesso'] = NIVEL_PARA_O_FRONT.get(colaborador['nivel_acesso'], colaborador['nivel_acesso'])

    # <input type="date"> espera AAAA-MM-DD
    if colaborador['data_contratacao']:
        colaborador['data_contratacao'] = colaborador['data_contratacao'].isoformat()
    colaborador['salario'] = formatar_salario(colaborador['salario'])

    return jsonify(colaborador)


@colaboradores_bp.route('/excluir-colaborador/<int:id_colaborador>', methods=['POST'])
@admin_required
def excluir_colaborador(id_colaborador):
    # Exclusão lógica: o registro continua no banco (há pedidos que o referenciam).
    with db_cursor(commit=True) as cursor:
        cursor.execute("UPDATE colaboradores SET ativo = 0 WHERE id = %s;", (id_colaborador,))

    return jsonify({'status': 'ok'})
