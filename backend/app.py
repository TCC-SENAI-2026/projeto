from flask import Flask
from flask_cors import CORS
from login import login_bp
from clientes import clientes_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(login_bp)
app.register_blueprint(clientes_bp)

if __name__ == '__main__':
    app.run(debug=False)