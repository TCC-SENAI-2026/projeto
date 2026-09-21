from flask import Blueprint, request, jsonify

login_bp = Blueprint('login', __name__)

usuarios = {
    "admin": "admin",
    "user": "user"
}

@login_bp.route('/login', methods=['POST'])
def login():
    data = request.json

    login = str(data.get('login'))
    senha = str(data.get('senha'))

    print("LOGIN:", login)
    print("SENHA:", senha)

    ##mensagem que aparece no console 
    if login in usuarios and usuarios[login] == senha:
        return jsonify({
            'msg': 'Login bem-sucedido!',
            'success': True
        })
    else:
        return jsonify({
            'msg': 'Login ou senha incorretos.',
            'success': False
        }), 401