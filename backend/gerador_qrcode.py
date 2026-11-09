import io
import os
import socket

import qrcode


def _detectar_ip_local():
    """IP da máquina na rede local, sem precisar configurar nada manualmente.

    Trata-se de um truque padrão: abrir um socket UDP "conectado" a um IP
    externo não envia nenhum pacote, só faz o sistema operacional escolher
    qual IP de rede local seria usado para alcançá-lo.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def _base_url():
    # LAN_URL continua funcionando como override manual (ex.: produção com domínio fixo).
    # Sem ela, detecta o IP da rede local automaticamente a cada QR gerado.
    base = os.getenv("LAN_URL")
    if not base:
        base = f"http://{_detectar_ip_local()}:5173"
    return base.rstrip("/")


def gerar_qrcode_pedido(pedido_id):
    url = f"{_base_url()}/pedidos/{pedido_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def gerar_qrcode_item(item_id):
    url = f"{_base_url()}/pedidos/itens/{item_id}/foto"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf
