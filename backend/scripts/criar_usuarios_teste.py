"""Mant?m o comando antigo para provisionar o administrador inicial."""

try:
    from .bootstrap_user import main
except ImportError:
    from bootstrap_user import main


def criar_administrador_inicial():
    return main('administrador')


if __name__ == '__main__':
    raise SystemExit(criar_administrador_inicial())
