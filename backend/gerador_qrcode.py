import io
import os

import qrcode


def gerar_qrcode_pedido(pedido_id):
    base = os.getenv("LAN_URL", "http://localhost:5173").rstrip("/")
    url = f"{base}/pedidos/{pedido_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def gerar_qrcode_item(item_id):
    base = os.getenv("LAN_URL", "http://localhost:5173").rstrip("/")
    url = f"{base}/pedidos/itens/{item_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf
