const API_PREFIX = '/api';

// O cookie HttpOnly pertence ao navegador. Apenas o token CSRF fica em memória,
// sem gravar senha, sessão ou perfil em localStorage/sessionStorage.
let csrfToken = null;

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function clearCsrfToken() {
  csrfToken = null;
}

// lista: true permite que a resposta seja um array (ex.: /listar-estoque).
// Por padrão só objetos são aceitos, como no login.
async function request(path, { method = 'GET', body, signal, lista = false } = {}) {
  const headers = { Accept: 'application/json' };

  // FormData (formulários com campos/arquivos) segue sem Content-Type: o navegador
  // define o multipart com o boundary correto. Objetos comuns viram JSON.
  const ehFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !ehFormData) headers['Content-Type'] = 'application/json';

  if (method !== 'GET') {
    if (!csrfToken) await fetchCsrfToken();
    headers['X-CSRF-Token'] = csrfToken;
  }

  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : (ehFormData ? body : JSON.stringify(body)),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar com o servidor. Tente novamente.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('O servidor retornou uma resposta inválida. Tente novamente.', response.status);
  }

  if (!data || typeof data !== 'object' || (Array.isArray(data) && !lista)) {
    throw new ApiError('O servidor retornou uma resposta inválida. Tente novamente.', response.status);
  }

  if (!response.ok || data.success === false) {
    // Outra aba ou uma sessão expirada pode ter invalidado o token em memória.
    // A próxima tentativa obtém um token atual; não repetimos operações automaticamente.
    if (response.status === 403) clearCsrfToken();
    // Os módulos antigos respondem com 'msg' (colaboradores) ou 'message' (estoque).
    throw new ApiError(data.msg || data.message || 'Não foi possível concluir a solicitação.', response.status);
  }

  // Login gira o token; /me também o fornece ao restaurar a sessão.
  if (typeof data.csrf_token === 'string' && data.csrf_token) {
    csrfToken = data.csrf_token;
  }

  return data;
}

async function fetchCsrfToken() {
  const data = await request('/csrf');
  if (typeof data.csrf_token !== 'string' || !data.csrf_token) {
    throw new ApiError('Não foi possível iniciar uma conexão segura. Tente novamente.');
  }
  return data.csrf_token;
}

// Toda tela que fala com o backend deve usar este cliente: ele envia o cookie de
// sessão e o X-CSRF-Token em POST/PUT/DELETE, igual ao login.
export const api = {
  get: (path, options) => request(path, options),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  fetchCsrfToken,
};
