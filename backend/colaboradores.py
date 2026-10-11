from flask import Blueprint, request, jsonify
import mysql.connector
import resources.database_connection as database_connection
import resources.email_service as email_service
import resources.seguranca as seguranca

colaboradores_bp = Blueprint('colaboradores', __name__)

NIVEIS_ACESSO = ('administrativo', 'padrao')
PREFERENCIAS_NOTIFICACAO = ('email', 'sms', 'ambos')


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


@colaboradores_bp.route('/cadastrar-colaborador', methods=['GET', 'POST'])
def cadastrar_colaborador():
    if request.method == 'POST':
        nome_completo            = request.form.get('nome_completo', '').strip()
        re                       = vazio_para_none(request.form.get('re'))
        cpf                      = vazio_para_none(request.form.get('cpf'))
        data_nascimento          = vazio_para_none(request.form.get('data_nascimento'))
        telefone                 = vazio_para_none(request.form.get('telefone'))
        email                    = vazio_para_none(request.form.get('email'))
        endereco                 = request.form.get('endereco')
        nivel_acesso             = validar_opcao(request.form.get('nivel_acesso'), NIVEIS_ACESSO, 'padrao')
        data_contratacao         = vazio_para_none(request.form.get('data_contratacao'))
        salario                  = converter_salario(request.form.get('salario'))
        preferencia_notificacoes = validar_opcao(request.form.get('preferencia_notificacoes'), PREFERENCIAS_NOTIFICACAO, 'email')
        ativo                    = 1 if request.form.get('status') == 'ativo' else 0

        if not nome_completo:
            return jsonify({'status': 'erro', 'msg': 'Informe o nome do colaborador.'}), 400

        erro = validar_canais(preferencia_notificacoes, email, telefone)
        if erro:
            return jsonify({'status': 'erro', 'msg': erro}), 400

        token = seguranca.gerar_token()
        token_hash = seguranca.hash_token(token)

        conn = database_connection.open_connection()
        cursor = conn.cursor()

        # senha_hash fica NULL até o colaborador definir a senha pelo link.
        # A validade do token (24h) é calculada pelo próprio MySQL.
        SQL = """
            INSERT INTO colaboradores
                (nome_completo, re, cpf, data_nascimento, telefone, email,
                endereco, nivel_acesso, data_contratacao, salario,
                preferencia_notificacoes, token_ativacao_hash, token_expira_em, ativo)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                DATE_ADD(NOW(), INTERVAL 24 HOUR), %s);
        """
        try:
            cursor.execute(SQL, (nome_completo, re, cpf, data_nascimento, telefone, email,
                endereco, nivel_acesso, data_contratacao, salario,
                preferencia_notificacoes, token_hash, ativo))
            conn.commit()
        except mysql.connector.IntegrityError as erro_db:
            conn.rollback()
            print('ERRO DE INTEGRIDADE:', erro_db)
            return jsonify({'status': 'erro', 'msg': f'Erro do banco: {erro_db}'}), 409
        finally:
            cursor.close()
            conn.close()

        try:
            email_service.enviar_link_ativacao(nome_completo, email, telefone,
                preferencia_notificacoes, token)
        except Exception as erro_envio:
            print('ERRO AO ENVIAR LINK DE ATIVACAO:', erro_envio)
            return jsonify({
                'status': 'ok',
                'aviso': 'Colaborador cadastrado, mas não foi possível enviar o link. Use o reenvio de link.'
            })

        return jsonify({'status': 'ok'})

    return jsonify({'status': 'ok'})


@colaboradores_bp.route('/reenviar-link/<int:id_colaborador>', methods=['POST'])
def reenviar_link(id_colaborador):
    conn = database_connection.open_connection()
    cursor = conn.cursor(buffered=True)

    SQL = """
        SELECT nome_completo, email, telefone, preferencia_notificacoes
        FROM colaboradores
        WHERE id_colaborador = %s AND ativo = 1;
    """
    cursor.execute(SQL, (id_colaborador,))
    colaborador = cursor.fetchone()

    if not colaborador:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'msg': 'Colaborador não encontrado.'}), 404

    nome_completo, email, telefone, preferencia = colaborador

    erro = validar_canais(preferencia, email, telefone)
    if erro:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'msg': erro}), 400

    token = seguranca.gerar_token()

    SQL = """
        UPDATE colaboradores
        SET token_ativacao_hash = %s, token_expira_em = DATE_ADD(NOW(), INTERVAL 24 HOUR)
        WHERE id_colaborador = %s;
    """
    cursor.execute(SQL, (seguranca.hash_token(token), id_colaborador))
    conn.commit()
    cursor.close()
    conn.close()

    try:
        email_service.enviar_link_ativacao(nome_completo, email, telefone, preferencia, token)
    except Exception as erro_envio:
        print('ERRO AO REENVIAR LINK DE ATIVACAO:', erro_envio)
        return jsonify({'status': 'erro', 'msg': 'Não foi possível enviar o link.'}), 500

    return jsonify({'status': 'ok'})


@colaboradores_bp.route('/listar-colaboradores', methods=['GET'])
def listar_colaboradores():
    conn = database_connection.open_connection()
    cursor = conn.cursor(dictionary=True)

    # Só o que a tela de equipe precisa (sem CPF, salário, etc.).
    # senha_definida = 0 significa que o colaborador ainda não usou o link.
    SQL = """
        SELECT id_colaborador, nome_completo, re, email, nivel_acesso,
               preferencia_notificacoes, ativo,
               (senha_hash IS NOT NULL) AS senha_definida
        FROM colaboradores
        WHERE ativo = 1
        ORDER BY nome_completo;
    """
    cursor.execute(SQL)
    colaboradores = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(colaboradores)


@colaboradores_bp.route('/alterar-nivel-acesso/<int:id_colaborador>', methods=['POST'])
def alterar_nivel_acesso(id_colaborador):
    data = request.get_json(silent=True) or {}
    nivel_acesso = data.get('nivel_acesso')

    if nivel_acesso not in NIVEIS_ACESSO:
        return jsonify({'status': 'erro', 'msg': 'Nível de acesso inválido.'}), 400

    conn = database_connection.open_connection()
    cursor = conn.cursor()

    SQL = "UPDATE colaboradores SET nivel_acesso = %s WHERE id_colaborador = %s;"
    cursor.execute(SQL, (nivel_acesso, id_colaborador))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 'ok'})


@colaboradores_bp.route('/editar-colaborador/<int:id_colaborador>', methods=['GET', 'POST'])
def editar_colaborador(id_colaborador):
    conn = database_connection.open_connection()

    if request.method == 'POST':
        cursor = conn.cursor()

        nome_completo            = request.form.get('nome_completo', '').strip()
        re                       = vazio_para_none(request.form.get('re'))
        cpf                      = vazio_para_none(request.form.get('cpf'))
        data_nascimento          = vazio_para_none(request.form.get('data_nascimento'))
        telefone                 = vazio_para_none(request.form.get('telefone'))
        email                    = vazio_para_none(request.form.get('email'))
        endereco                 = request.form.get('endereco')
        nivel_acesso             = validar_opcao(request.form.get('nivel_acesso'), NIVEIS_ACESSO, 'padrao')
        data_contratacao         = vazio_para_none(request.form.get('data_contratacao'))
        salario                  = converter_salario(request.form.get('salario'))
        preferencia_notificacoes = validar_opcao(request.form.get('preferencia_notificacoes'), PREFERENCIAS_NOTIFICACAO, 'email')
        ativo                    = 1 if request.form.get('status') == 'ativo' else 0

        if not nome_completo:
            cursor.close()
            conn.close()
            return jsonify({'status': 'erro', 'msg': 'Informe o nome do colaborador.'}), 400

        SQL = """
            UPDATE colaboradores
            SET nome_completo = %s, re = %s, cpf = %s, data_nascimento = %s,
                telefone = %s, email = %s, endereco = %s, nivel_acesso = %s,
                data_contratacao = %s, salario = %s,
                preferencia_notificacoes = %s, ativo = %s
            WHERE id_colaborador = %s;
        """
        try:
            cursor.execute(SQL, (nome_completo, re, cpf, data_nascimento, telefone, email,
                endereco, nivel_acesso, data_contratacao, salario,
                preferencia_notificacoes, ativo, id_colaborador))
            conn.commit()
        except mysql.connector.IntegrityError as erro_db:
            conn.rollback()
            print('ERRO DE INTEGRIDADE:', erro_db)
            return jsonify({'status': 'erro', 'msg': f'Erro do banco: {erro_db}'}), 409
        finally:
            cursor.close()
            conn.close()

        return jsonify({'status': 'ok'})

    # GET: devolve os dados para preencher o formulário de edição
    cursor = conn.cursor(dictionary=True)
    SQL = """
        SELECT nome_completo, re, cpf, data_nascimento, telefone, email,
               endereco, nivel_acesso, data_contratacao, salario,
               preferencia_notificacoes, ativo,
               (senha_hash IS NOT NULL) AS senha_definida
        FROM colaboradores WHERE id_colaborador = %s;
    """
    cursor.execute(SQL, (id_colaborador,))
    colaborador = cursor.fetchone()
    cursor.close()
    conn.close()

    if not colaborador:
        return jsonify({'status': 'erro', 'msg': 'Colaborador não encontrado.'}), 404

    # <input type="date"> espera AAAA-MM-DD
    for campo in ('data_nascimento', 'data_contratacao'):
        if colaborador[campo]:
            colaborador[campo] = colaborador[campo].isoformat()
    colaborador['salario'] = formatar_salario(colaborador['salario'])

    return jsonify(colaborador)


@colaboradores_bp.route('/excluir-colaborador/<int:id_colaborador>', methods=['POST'])
def excluir_colaborador(id_colaborador):
    conn = database_connection.open_connection()
    cursor = conn.cursor()

    SQL = "UPDATE colaboradores SET ativo = 0 WHERE id_colaborador = %s;"
    cursor.execute(SQL, (id_colaborador,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 'ok'})