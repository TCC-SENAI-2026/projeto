import { api } from './api.js';

export const buscarPerfil = () => api.get('/perfil');

export async function salvarPerfil(form, foto, removerFoto = false) {
    const proposta = Object.fromEntries(['nome', 'email', 'telefone', 'endereco'].map(campo => [campo, form[campo] ?? '']));
    if (foto) {
        if (foto.size > 1024 * 1024) throw new Error('A foto deve ter no máximo 1 MB.');
        proposta.foto = await new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = () => resolve(leitor.result);
            leitor.onerror = () => reject(new Error('Não foi possível preparar a foto.'));
            leitor.readAsDataURL(foto);
        });
    } else if (removerFoto) proposta.foto = null;
    return api.put('/perfil', proposta);
}
