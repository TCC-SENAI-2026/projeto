from flask import Flask
from flask_cors import CORS

from login import login_bp
from clientes import clientes_bp
from colaboradores import colaboradores_bp
from estoque import estoque_bp

import sys
sys.stdout.reconfigure(line_buffering=True) 

app = Flask(__name__)

CORS(app)


app.register_blueprint(login_bp)
app.register_blueprint(clientes_bp)
app.register_blueprint(colaboradores_bp)
app.register_blueprint(estoque_bp)


if __name__ == '__main__':
    app.run(debug=False)
