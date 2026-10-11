import os
import smtplib
from email.message import EmailMessage

NOME_SISTEMA = 'EThreads'

# ------------------------------------------------------------
# Configurações de e-mail
# Em desenvolvimento use o Mailtrap (Email Testing > Inboxes >
# SMTP Settings) e cole usuário e senha abaixo, ou defina as
# variáveis de ambiente com os mesmos nomes.
#
# Para usar Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587,
# SMTP_USER=seu@gmail.com e SMTP_PASS=<senha de app>.
# ------------------------------------------------------------
SMTP_HOST = os.environ.get('SMTP_HOST', 'sandbox.smtp.mailtrap.io')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
EMAIL_REMETENTE = os.environ.get('EMAIL_REMETENTE', 'no-reply@ethreads.local')

# Endereço do front (Vite usa 5173; Create React App usa 3000)
FRONT_URL = os.environ.get('FRONT_URL', 'http://localhost:5173')


def montar_link(token):
    return f'{FRONT_URL}/definir-senha?token={token}'


def enviar_email(destino, assunto, corpo):
    msg = EmailMessage()
    msg['Subject'] = assunto
    msg['From'] = EMAIL_REMETENTE
    msg['To'] = destino
    msg.set_content(corpo)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as servidor:
            #servidor.set_debuglevel(1)  # descomente para ver a conversa com o servidor
        servidor.ehlo()
        servidor.starttls()
        servidor.ehlo()
        servidor.esmtp_features['auth'] = 'PLAIN LOGIN'
        servidor.login(SMTP_USER, SMTP_PASS)
        servidor.send_message(msg)

def enviar_sms(telefone, mensagem):
    # SMS simulado: aparece no console do Flask.
    # Para integrar de verdade, troque o print por uma chamada
    # à API do provedor (ex.: Twilio).
    print(f'[SMS SIMULADO] Para {telefone}: {mensagem}')


def enviar_link_ativacao(nome, email, telefone, preferencia, token):
    link = montar_link(token)
    primeiro_nome = nome.split()[0] if nome else ''

    corpo = (
        f'Olá, {primeiro_nome}!\n\n'
        f'Seu cadastro no sistema {NOME_SISTEMA} foi criado.\n'
        'Clique no link abaixo para definir sua senha (válido por 24 horas):\n\n'
        f'{link}\n\n'
        'Se você não esperava este e-mail, ignore esta mensagem.'
    )

    if preferencia in ('email', 'ambos'):
        enviar_email(email, 'Defina sua senha de acesso', corpo)

    if preferencia in ('sms', 'ambos'):
        enviar_sms(telefone, f'{NOME_SISTEMA}: defina sua senha em {link} (válido por 24h)')
