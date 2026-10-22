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

async function request(path, { method = 'GET', body, signal, raw = false } = {}) {
  const headers = { Accept: 'application/json' };

  // raw=true: corpo é FormData — não define Content-Type (o browser define com o boundary)
  if (!raw && body !== undefined) headers['Content-Type'] = 'application/json';

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
      body: raw ? body : (body === undefined ? undefined : JSON.stringify(body)),
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

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError('O servidor retornou uma resposta inválida. Tente novamente.', response.status);
  }

  if (!response.ok || data.success === false) {
    // Outra aba ou uma sessão expirada pode ter invalidado o token em memória.
    // A próxima tentativa obtém um token atual; não repetimos operações automaticamente.
    if (response.status === 403) clearCsrfToken();
    throw new ApiError(data.msg || 'Não foi possível concluir a solicitação.', response.status);
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

export const api = {
  get:      (path, options) => request(path, options),
  post:     (path, body)    => request(path, { method: 'POST', body }),
  put:      (path, body)    => request(path, { method: 'PUT',  body }),
  patch:    (path, body)    => request(path, { method: 'PATCH', body }),
  delete:   (path)          => request(path, { method: 'DELETE' }),
  postFile: (path, formData) => request(path, { method: 'POST', body: formData, raw: true }),
  fetchCsrfToken,
};
