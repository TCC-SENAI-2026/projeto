"""Fase 03: inicializacao unificada do E-Threads para a equipe.

Comando unico: `npm run start` (que chama este script via iniciar_sistema.cjs,
garantindo que seja executado pelo Python da venv independentemente do PATH).

Fluxo:
1. Verifica conexao com o MySQL e se o schema foi aplicado (tabela
   `colaboradores` acessivel).
2. Executa `criar_usuarios_teste.py` para cadastrar as contas de
   desenvolvimento ausentes. Nao altera contas existentes.
3. Sobe o backend Flask e o frontend Vite em paralelo.
4. Ctrl+C encerra os dois processos de forma limpa.

Nao instala MySQL, nao recria tabelas, nao sobrescreve senhas.
Nao deve ser usado em producao.
"""

import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
SCRIPTS = BACKEND / "scripts"
NPM = "npm.cmd" if os.name == "nt" else "npm"

# iniciar_sistema.cjs ja encontrou a venv (em .venv/ ou backend/.venv/) e
# invocou este script com o Python correto, entao sys.executable serve para
# os subprocessos sem precisarmos repetir a busca.
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(SCRIPTS))


def verificar_banco():
    """Confere .env, conexao e schema antes de qualquer servidor subir."""
    try:
        from flask import Flask
        from config import load_config
        from database.connection import db_cursor, init_db
        import mysql.connector
    except ImportError as erro:
        print(
            f"Dependencia Python ausente: {erro}.\n"
            "Instale backend/requirements.txt na venv antes de iniciar.",
            file=sys.stderr,
        )
        return False

    try:
        app = Flask(__name__)
        app.config.update(load_config())
        init_db(app)
    except (RuntimeError, ValueError) as erro:
        print(f"Configuracao invalida: {erro}", file=sys.stderr)
        return False

    try:
        with app.app_context(), db_cursor() as cursor:
            cursor.execute("SELECT 1 FROM colaboradores LIMIT 1")
            cursor.fetchall()
    except mysql.connector.errors.ProgrammingError as erro:
        if erro.errno == 1146:
            print(
                "A tabela 'colaboradores' nao existe no banco configurado.\n"
                "Aplique backend/database/schema.sql no MySQL Workbench antes de iniciar.",
                file=sys.stderr,
            )
        else:
            print(
                "Erro de SQL inesperado ao consultar 'colaboradores'. "
                "Verifique se o schema foi aplicado corretamente.",
                file=sys.stderr,
            )
        return False
    except mysql.connector.Error:
        print(
            "Nao foi possivel conectar ao MySQL.\n"
            "Verifique backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) "
            "e se o servico do MySQL esta rodando.",
            file=sys.stderr,
        )
        return False
    return True


def cadastrar_usuarios_teste():
    """Importa criar_usuarios_teste e roda sua main(). Exit 2 nao bloqueia."""
    import criar_usuarios_teste

    codigo = criar_usuarios_teste.main()
    if codigo == 0:
        return True
    if codigo == 2:
        print(
            "Conflito detectado nas contas de desenvolvimento (acima). "
            "Nenhum dado foi alterado; prosseguindo com a inicializacao.",
            file=sys.stderr,
        )
        return True
    print(
        "Falha ao cadastrar contas de desenvolvimento; o sistema nao sera iniciado.",
        file=sys.stderr,
    )
    return False


def _subir(label, args):
    """Popen com saida prefixada por tag, para distinguir Flask e Vite."""
    processo = subprocess.Popen(
        args,
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    def _pump():
        prefixo = f"[{label}] "
        try:
            for linha in processo.stdout:
                sys.stdout.write(prefixo + linha)
                sys.stdout.flush()
        except Exception:
            pass

    threading.Thread(target=_pump, daemon=True).start()
    return processo


def iniciar_servidores():
    """Sobe Flask e Vite; encerra ambos no Ctrl+C ou se um deles cair."""
    print("Iniciando backend (Flask) e frontend (Vite). Ctrl+C para encerrar.", flush=True)
    flask = _subir("flask", [sys.executable, str(BACKEND / "app.py")])
    vite = _subir("vite", [NPM, "run", "dev"])
    try:
        while True:
            if flask.poll() is not None:
                print("[flask] processo encerrou; parando o Vite.", file=sys.stderr)
                return flask.returncode or 1
            if vite.poll() is not None:
                print("[vite] processo encerrou; parando o Flask.", file=sys.stderr)
                return vite.returncode or 1
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nEncerrando a pedido do usuario...", flush=True)
        return 0
    finally:
        for processo in (vite, flask):
            if processo.poll() is None:
                try:
                    if os.name == "nt":
                        processo.send_signal(signal.CTRL_BREAK_EVENT)
                    else:
                        processo.terminate()
                    processo.wait(timeout=5)
                except (subprocess.TimeoutExpired, OSError):
                    processo.kill()
                    processo.wait()


def main():
    print("[1/2] Verificando MySQL e schema...", flush=True)
    if not verificar_banco():
        return 1
    print("      conexao e schema OK.", flush=True)

    print("[2/2] Cadastrando contas de desenvolvimento...", flush=True)
    if not cadastrar_usuarios_teste():
        return 1

    return iniciar_servidores() or 0


if __name__ == "__main__":
    raise SystemExit(main())
