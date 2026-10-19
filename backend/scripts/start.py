
# scripts/start.py
# Inicialização multiplataforma do E-Threads.
# Compatível com Windows, macOS e Linux.

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"

if os.name == "nt":
    python = BACKEND / ".venv" / "Scripts" / "python.exe"
    npm = "npm.cmd"
else:
    python = BACKEND / ".venv" / "bin" / "python"
    npm = "npm"

if not python.exists():
    sys.exit(
        "Ambiente virtual não encontrado em backend/.venv.\n"
        "Crie a venv e instale backend/requirements.txt."
    )

backend_process = subprocess.Popen(
    [str(python), str(BACKEND / "app.py")],
    cwd=ROOT,
)

try:
    subprocess.run(
        [npm, "run", "dev"],
        cwd=ROOT,
        check=True,
    )
except KeyboardInterrupt:
    pass
finally:
    backend_process.terminate()
    try:
        backend_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        backend_process.kill()
        backend_process.wait()
