"""Perfil próprio, proposta restrita e aplicação transacional por administrador."""
import base64
import binascii
import io
import json
import re

from flask import Blueprint, g, jsonify, request
from mysql.connector import IntegrityError
from PIL import Image

from auth.decorators import login_required
from database.connection import db_cursor, open_connection
from resources.foto_colaborador import LIMITE_FOTO, validar_foto

perfil_bp = Blueprint('perfil', __name__)
CAMPOS_EDITAVEIS = frozenset(('nome', 'email', 'telefone', 'endereco', 'foto'))
ROTULOS = {'nome': 'Nome', 'email': 'E-mail', 'telefone': 'Telefone', 'endereco': 'Endereço', 'foto': 'Foto'}


class ErroPerfil(ValueError):
    def __init__(self, mensagem, status=400):
        super().__init__(mensagem)
        self.status = status


def decodificar_foto(valor):
    if valor is None:
        return None, None
    if not isinstance(valor, str) or len(valor) > 4 * ((LIMITE_FOTO + 2) // 3) + 64:
        raise ErroPerfil('A foto deve ter no máximo 1 MB.')
    cabecalho, separador, conteudo = valor.partition(',')
    if not separador or cabecalho not in ('data:image/jpeg;base64', 'data:image/png;base64', 'data:image/webp;base64'):
        raise ErroPerfil('Foto inválida. Envie uma imagem comprimida em base64.')
    try:
        dados = base64.b64decode(conteudo, validate=True)
        mime = validar_foto(dados)
        with Image.open(io.BytesIO(dados)) as imagem:
            if max(imagem.size) > 512:
                raise ErroPerfil('A foto deve ter lado maior de até 512 px.')
        if cabecalho != f'data:{mime};base64':
            raise ErroPerfil('O tipo declarado não corresponde ao conteúdo da foto.')
    except (ValueError, binascii.Error) as erro:
        raise ErroPerfil(str(erro)) from erro
    return mime, dados


def validar_proposta(proposta):
    if not isinstance(proposta, dict) or not proposta:
        raise ErroPerfil('Informe as alterações do perfil.')
    if set(proposta) - CAMPOS_EDITAVEIS:
        raise ErroPerfil('Campo não permitido. Edite somente nome, e-mail, telefone, endereço e foto.')
    resultado = {}
    for campo, valor in proposta.items():
        if campo == 'foto':
            mime, dados = decodificar_foto(valor)
            resultado[campo] = f'data:{mime};base64,{base64.b64encode(dados).decode("ascii")}' if dados else None
            continue
        if valor is None and campo in ('telefone', 'endereco'):
            valor = ''
        if not isinstance(valor, str):
            raise ErroPerfil(f'{ROTULOS[campo]} deve ser texto.')
        valor = valor.strip()
        limite = {'nome': 150, 'email': 254, 'telefone': 20, 'endereco': 255}[campo]
        if len(valor) > limite or any(ord(c) < 32 for c in valor):
            raise ErroPerfil(f'{ROTULOS[campo]} inválido ou acima de {limite} caracteres.')
        if campo == 'nome' and not valor:
            raise ErroPerfil('Informe o nome.')
        if campo == 'email' and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', valor):
            raise ErroPerfil('Informe um e-mail válido.')
        if campo == 'telefone' and valor and (not re.fullmatch(r'[+\d() .-]+', valor) or not 8 <= len(re.sub(r'\D', '', valor)) <= 15):
            raise ErroPerfil('Informe um telefone válido, com 8 a 15 dígitos.')
        resultado[campo] = valor or None
    return resultado


def verificar_email(cursor, email, colaborador_id):
    # A restrição UNIQUE também protege contra concorrência após esta consulta.
    cursor.execute('SELECT id FROM colaboradores WHERE email = %s AND id <> %s LIMIT 1 FOR UPDATE',
                   (email, colaborador_id))
    if cursor.fetchone():
        raise ErroPerfil('Este e-mail já está cadastrado para outro colaborador.', 409)


def foto_base64(colaborador):
    dados = colaborador.get('foto_dados')
    if not dados:
        return None
    return f'data:{colaborador["foto_mime"]};base64,{base64.b64encode(bytes(dados)).decode("ascii")}'


def estado_perfil(colaborador):
    return {**{campo: colaborador[campo] for campo in ('nome', 'email', 'telefone', 'endereco')},
            'foto': foto_base64(colaborador)}


def aplicar_campos(cursor, colaborador_id, campos):
    valores = {k: v for k, v in campos.items() if k != 'foto'}
    if 'foto' in campos:
        valores['foto_mime'], valores['foto_dados'] = decodificar_foto(campos['foto'])
    if valores:
        sql = ', '.join(f'{campo} = %s' for campo in valores)
        cursor.execute(f'UPDATE colaboradores SET {sql} WHERE id = %s', (*valores.values(), colaborador_id))


def comparar_proposta(antes, depois, campos):
    return [dict(campo=campo, rotulo=ROTULOS[campo], antigo=antes.get(campo), novo=depois.get(campo),
                 tipo='foto' if campo == 'foto' else 'texto') for campo in campos]


def processar_alteracao_perfil(proposta, alvo=None):
    colaborador_id = g.colaborador['id']
    if alvo is not None and (type(alvo) is not int or alvo != colaborador_id):
        return jsonify(success=False, msg='Você só pode alterar o próprio perfil.'), 403
    try:
        campos = validar_proposta(proposta)
    except ErroPerfil as erro:
        return jsonify(success=False, msg=str(erro)), erro.status
    conn = open_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)
        cursor.execute('SELECT id, nome, email, telefone, endereco, foto_mime, foto_dados FROM colaboradores '
                       'WHERE id = %s AND ativo = 1 FOR UPDATE', (colaborador_id,))
        atual = cursor.fetchone()
        if not atual:
            raise ErroPerfil('Colaborador não encontrado ou inativo.', 404)
        cursor.execute("SELECT id FROM solicitacoes WHERE colaborador_alvo_id = %s AND tipo = 'perfil' AND status = 'pendente'", (colaborador_id,))
        if cursor.fetchone():
            raise ErroPerfil('Alteração aguardando aprovação. Aguarde a decisão antes de enviar outra.', 409)
        antes = estado_perfil(atual)
        campos = {k: v for k, v in campos.items() if v != antes[k]}
        if not campos:
            raise ErroPerfil('Você ainda não alterou nada.')
        verificar_email(cursor, campos.get('email', atual['email']), colaborador_id)
        if g.colaborador['nivel_acesso'] == 'administrador':
            aplicar_campos(cursor, colaborador_id, campos)
            conn.commit()
            return jsonify(success=True, modo='direto', msg='Perfil atualizado.'), 200
        depois = {**antes, **campos}
        dados = dict(campos=campos, antes=antes, depois=depois,
                     resumo='Alteração de perfil', alteracoes=comparar_proposta(antes, depois, campos))
        cursor.execute("INSERT INTO solicitacoes (tipo, colaborador_alvo_id, colaborador_solicitante_id, dados_propostos, status) "
                       "VALUES ('perfil', %s, %s, %s, 'pendente')",
                       (colaborador_id, colaborador_id, json.dumps(dados, ensure_ascii=False)))
        solicitacao_id = cursor.lastrowid
        conn.commit()
        return jsonify(success=True, modo='solicitacao', id=solicitacao_id, msg='Alteração aguardando aprovação'), 201
    except ErroPerfil as erro:
        conn.rollback()
        return jsonify(success=False, msg=str(erro)), erro.status
    except IntegrityError:
        conn.rollback()
        return jsonify(success=False, msg='E-mail já cadastrado por outro colaborador.'), 409
    except Exception:
        conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        conn.close()


def aprovar_perfil(cursor, solicitacao, dados):
    alvo = solicitacao['colaborador_alvo_id']
    if alvo != solicitacao['colaborador_solicitante_id']:
        raise ErroPerfil('A solicitação não pertence ao colaborador alvo.')
    campos = validar_proposta(dados.get('campos'))
    cursor.execute('SELECT id, email FROM colaboradores WHERE id = %s AND ativo = 1 FOR UPDATE', (alvo,))
    colaborador = cursor.fetchone()
    if not colaborador:
        raise ErroPerfil('Colaborador não encontrado ou inativo.', 404)
    verificar_email(cursor, campos.get('email', colaborador['email']), alvo)
    aplicar_campos(cursor, alvo, campos)


@perfil_bp.get('/perfil')
@login_required
def buscar_perfil():
    with db_cursor() as cursor:
        cursor.execute('SELECT id, re, nome, cpf, email, telefone, endereco, nivel_acesso, salario, data_contrato, ativo, '
                       '(foto_dados IS NOT NULL) AS tem_foto FROM colaboradores WHERE id = %s', (g.colaborador['id'],))
        colaborador = cursor.fetchone()
        if not colaborador:
            return jsonify(success=False, msg='Perfil não encontrado.'), 404
        cursor.execute("SELECT id, status, data_solicitacao, data_decisao, dados_propostos FROM solicitacoes "
                       "WHERE tipo = 'perfil' AND colaborador_alvo_id = %s ORDER BY id DESC LIMIT 1", (colaborador['id'],))
        solicitacao = cursor.fetchone()
    if colaborador['data_contrato']:
        colaborador['data_contrato'] = str(colaborador['data_contrato'])
    if solicitacao:
        dados = solicitacao.pop('dados_propostos') or {}
        if isinstance(dados, str):
            dados = json.loads(dados)
        solicitacao['motivo'] = dados.get('motivo_recusa', '')
        for campo in ('data_solicitacao', 'data_decisao'):
            solicitacao[campo] = str(solicitacao[campo]) if solicitacao[campo] else None
    return jsonify(success=True, data=colaborador, solicitacao=solicitacao)


@perfil_bp.put('/perfil')
@login_required
def salvar_perfil():
    return processar_alteracao_perfil(request.get_json(silent=True))
