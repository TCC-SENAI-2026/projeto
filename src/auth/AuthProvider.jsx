import { definirContaAvisos } from '../services/solicitacoesService';
import { limparDadosTemporarios } from '../utils/dados_temporarios';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    if (error.status === 401 || error.status === 403) {
      clearCsrfToken();
      return { status: 'anonymous', colaborador: null, erro: '' };
    }
    // Uma falha de rede não significa logout e não provoca redirecionamentos em ciclo.
    return { status: 'error', colaborador: null, erro: error.message };
  }
}

export default function AuthProvider({ children }) {
  const [sessao, setSessao] = useState({ status: 'loading', colaborador: null, erro: '' });

  const consulta = useRef(null);
  const contaAtual = useRef(null);
  const versao = useRef(0);

  const aplicarSessao = useCallback(atualizada => {
    const proximaConta = atualizada.colaborador?.id ?? null;
    if (atualizada.status !== 'error') {
      if (contaAtual.current !== null && contaAtual.current !== proximaConta) limparDadosTemporarios();
      contaAtual.current = proximaConta;
      definirContaAvisos(proximaConta);
    }
    setSessao(atualizada);
  }, []);

  const revalidar = useCallback(async () => {
    consulta.current?.abort();
    const controller = new AbortController();
    consulta.current = controller;
    const atual = ++versao.current;
    const atualizada = await consultarSessao(controller.signal);
    if (!controller.signal.aborted && atual === versao.current) aplicarSessao(atualizada);
  }, [aplicarSessao]);

  useEffect(() => {
    let ativo = true;
    void Promise.resolve().then(() => { if (ativo) return revalidar(); });
    const aoVoltar = () => {
      if (document.visibilityState !== 'hidden') void revalidar();
    };
    window.addEventListener('focus', aoVoltar);
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('pageshow', aoVoltar);
    return () => {
      ativo = false;
      consulta.current?.abort();
      window.removeEventListener('focus', aoVoltar);
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('pageshow', aoVoltar);
    };
  }, [revalidar]);

  async function tentarNovamente() {
    setSessao({ status: 'loading', colaborador: null, erro: '' });
    await revalidar();
  }

  async function entrar(re, senha) {
    consulta.current?.abort();
    ++versao.current;
    // Inclusive o login precisa de CSRF: primeiro obtemos o token anônimo.
    await api.fetchCsrfToken();
    await api.post('/login', { re, senha });
    // O perfil usado pelo React vem da sessão confirmada no backend, nunca do formulário.
    const colaborador = validarColaborador(await api.get('/me'));
    consulta.current?.abort();
    ++versao.current;
    limparDadosTemporarios();
    aplicarSessao({ status: 'authenticated', colaborador, erro: '' });
  }

  async function sair() {
    consulta.current?.abort();
    ++versao.current;
    try {
      // Atualiza o token caso outra aba tenha trocado a sessão desde o login.
      await api.fetchCsrfToken();
      await api.post('/logout');
    } catch (error) {
      // Se o servidor já não reconhece a sessão, também encerramos a visão local.
      if (error.status !== 401) throw error;
    }
    clearCsrfToken();
    consulta.current?.abort();
    ++versao.current;
    limparDadosTemporarios();
    aplicarSessao({ status: 'anonymous', colaborador: null, erro: '' });
  }

  return (
    <AuthContext.Provider value={{ ...sessao, entrar, sair, tentarNovamente }}>
      {children}
    </AuthContext.Provider>
  );
}
