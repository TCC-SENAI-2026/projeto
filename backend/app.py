"""Cria o Flask e integra autenticação sem reescrever módulos da equipe."""

from flask import Flask, jsonify, request
from flask_cors import CORS
from mysql.connector import Error as MySQLError

from auth.csrf import init_csrf
from auth.decorators import admin_required, login_required
from catalogo import catalogo_bp
from clientes import clientes_bp
from colaboradores import colaboradores_bp
from config import load_config
from database.connection import init_db
from estoque import estoque_bp
from login import login_bp
from pedidos import pedidos_bp
from solicitacoes import solicitacoes_bp


def create_app(test_config=None):
    """Factory também permite testar sem acessar um MySQL real."""
    app = Flask(__name__)
    app.config.update(load_config())
    if test_config:
        app.config.update(test_config)

    init_db(app)
    # A SPA usa /api no Vite, que remove o prefixo e encaminha ao Flask.
    # CORS restringe também os consumidores legados ainda não migrados.
    CORS(app, origins=[app.config['FRONTEND_ORIGIN']],
         supports_credentials=True, allow_headers=['Content-Type', 'X-CSRF-Token'])
    init_csrf(app)

    app.register_blueprint(login_bp)
    app.register_blueprint(clientes_bp)
    app.register_blueprint(colaboradores_bp)
    app.register_blueprint(estoque_bp)
    app.register_blueprint(catalogo_bp)
    app.register_blueprint(pedidos_bp)
    app.register_blueprint(solicitacoes_bp)

    @app.before_request
    def protect_existing_modules():
        """Aplica T03 antes da lógica legada, inclusive nas URLs diretas.

        Colaboradores é uma área administrativa. Clientes e estoque exigem
        sessão. Não muda consultas/regras internas, previstas em T04/T07/T10.
        Blueprints futuros devem usar os mesmos decorators explicitamente.
        """
        if request.method == 'OPTIONS':
            return None
        if request.blueprint == 'colaboradores':
            return admin_required(lambda: None)()
        if request.blueprint in ('clientes', 'estoque'):
            return login_required(lambda: None)()
        # pedidos, solicitacoes e catalogo protegem cada rota com seus próprios decorators
        return None

    @app.errorhandler(MySQLError)
    def database_unavailable(error):
        app.logger.warning('Consulta MySQL indisponível (%s): %s', type(error).__name__, error)
        return jsonify(success=False, msg='Banco de dados indisponível. Tente novamente.'), 503

    @app.after_request
    def prevent_private_caching(response):
        response.headers['Cache-Control'] = 'no-store'
        return response

    return app


if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=False)
