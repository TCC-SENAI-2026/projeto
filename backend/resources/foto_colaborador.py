"""Validação de foto independente do MIME declarado pelo cliente."""
import io
import warnings

from PIL import Image, UnidentifiedImageError

LIMITE_FOTO = 1024 * 1024
TIPOS_FOTO = {'JPEG': 'image/jpeg', 'PNG': 'image/png', 'WEBP': 'image/webp'}


def validar_foto(dados):
    if not dados or len(dados) > LIMITE_FOTO:
        raise ValueError('A foto deve ter conteúdo e no máximo 1 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(dados)) as imagem:
                mime = TIPOS_FOTO.get(imagem.format)
                if not mime:
                    raise ValueError('Use uma foto JPEG, PNG ou WebP válida.')
                imagem.verify()
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError,
            Image.DecompressionBombWarning) as erro:
        raise ValueError('O arquivo não é uma imagem JPEG, PNG ou WebP válida.') from erro
    return mime


def ler_foto_formulario(formulario, arquivos):
    remover = formulario.get('remover_foto', 'false')
    if remover not in ('true', 'false', '1', '0'):
        raise ValueError('Opção de remoção de foto inválida.')
    foto = arquivos.get('foto')
    if remover in ('true', '1'):
        if foto is not None:
            raise ValueError('Envie uma foto ou solicite a remoção, não ambos.')
        return True, None, None
    if foto is None:
        return False, None, None
    dados = foto.read(LIMITE_FOTO + 1)
    return True, validar_foto(dados), dados
