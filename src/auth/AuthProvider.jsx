import { useEffect, useState } from 'react';
import { api, ApiError, clearCsrfToken } from '../services/api';
import { AuthContext } from './AuthContext';

function validarColaborador(data) {
  if (!data.id || typeof data.nome !== 'string' || typeof data.re !== 'string'
    || !['administrador', 'colaborador'].includes(data.nivel_acesso)
    || typeof data.csrf_token !== 'string' || !data.csrf_token) {
    throw new ApiError('Não foi possível identificar a sessão. Tente novamente.');
  }

  return { id: data.id, re: data.re, nome: data.nome, nivel_acesso: data.nivel_acesso };
}

async function consultarSessao(signal) {
  try {
    const data = await api.get('/me', { signal });
    return { status: 'authenticated', colaborador: validarColaborador(data), erro: '' };
  } catch (error) {
    if (error.status === 401) {
      clearCsrfToken();
      return { status: 'anonymous', colaborador: null, erro: '' };
    }
    // Uma falha de rede não significa logout e não provoca redirecionamentos em ciclo.
    return { status: 'error', colaborador: null, erro: error.message };
  }
}

export default function AuthProvider({ children }) {
  const [sessao, setSessao] = useState({ status: 'loading', colaborador: null, erro: '' });

  useEffect(() => {
    const controller = new AbortController();
    consultarSessao(controller.signal).then((atualizada) => {
      if (!controller.signal.aborted) setSessao(atualizada);
    });
    return () => controller.abort();
  }, []);

  async function tentarNovamente() {
    setSessao({ status: 'loading', colaborador: null, erro: '' });
    setSessao(await consultarSessao());
  }

  async function entrar(re, senha) {
    // Inclusive o login precisa de CSRF: primeiro obtemos o token anônimo.
    await api.fetchCsrfToken();
    await api.post('/login', { re, senha });
    // O perfil usado pelo React vem da sessão confirmada no backend, nunca do formulário.
    const colaborador = validarColaborador(await api.get('/me'));
    setSessao({ status: 'authenticated', colaborador, erro: '' });
  }

  async function sair() {
    try {
      // Atualiza o token caso outra aba tenha trocado a sessão desde o login.
      await api.fetchCsrfToken();
      await api.post('/logout');
    } catch (error) {
      // Se o servidor já não reconhece a sessão, também encerramos a visão local.
      if (error.status !== 401) throw error;
    }
    clearCsrfToken();
    setSessao({ status: 'anonymous', colaborador: null, erro: '' });
  }

  return (
    <AuthContext.Provider value={{ ...sessao, entrar, sair, tentarNovamente }}>
      {children}
    </AuthContext.Provider>
  );
}
