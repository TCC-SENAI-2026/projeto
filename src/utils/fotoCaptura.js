export function pararCamera(stream) {
    stream?.getTracks().forEach(track => track.stop());
}

export async function comprimirFonteFoto(fonte, largura, altura) {
    if (!largura || !altura) throw new Error('A imagem ainda não está pronta. Tente novamente.');
    const escala = Math.min(1, 512 / Math.max(largura, altura));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(largura * escala));
    canvas.height = Math.max(1, Math.round(altura * escala));
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('Não foi possível preparar a foto neste navegador.');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(fonte, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size > 1024 * 1024) throw new Error('Não foi possível reduzir a foto para até 1 MB.');
    return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
}

export async function prepararFotoGaleria(arquivo) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
        throw new Error('Escolha uma imagem JPEG, PNG ou WebP.');
    }
    const url = URL.createObjectURL(arquivo);
    try {
        const imagem = new Image();
        await new Promise((resolve, reject) => {
            imagem.onload = resolve;
            imagem.onerror = () => reject(new Error('Não foi possível abrir a imagem selecionada.'));
            imagem.src = url;
        });
        return await comprimirFonteFoto(imagem, imagem.naturalWidth, imagem.naturalHeight);
    } finally {
        URL.revokeObjectURL(url);
    }
}
